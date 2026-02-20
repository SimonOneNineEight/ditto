package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/testutil"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestNotificationRepository(t *testing.T) {
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	userRepo := NewUserRepository(db.Database)
	notifRepo := NewNotificationRepository(db.Database)

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)

	testUser, err := userRepo.CreateUser("notiftest@example.com", "Notification Test User", string(hashedPassword))
	require.NoError(t, err)

	testUser2, err := userRepo.CreateUser("notiftest2@example.com", "Notification Test User 2", string(hashedPassword))
	require.NoError(t, err)

	t.Run("Create", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			notification := &models.Notification{
				UserID:  testUser.ID,
				Type:    models.NotificationTypeInterviewReminder,
				Title:   "Interview Tomorrow",
				Message: "You have an interview scheduled for tomorrow at 10 AM.",
			}

			created, err := notifRepo.Create(notification)

			require.NoError(t, err)
			require.NotNil(t, created)
			assert.NotEqual(t, uuid.Nil, created.ID)
			assert.Equal(t, testUser.ID, created.UserID)
			assert.Equal(t, models.NotificationTypeInterviewReminder, created.Type)
			assert.Equal(t, "Interview Tomorrow", created.Title)
			assert.Equal(t, "You have an interview scheduled for tomorrow at 10 AM.", created.Message)
			assert.Nil(t, created.Link)
			assert.False(t, created.Read)
			assert.False(t, created.CreatedAt.IsZero())
			assert.Nil(t, created.DeletedAt)
		})

		t.Run("WithLink", func(t *testing.T) {
			notification := &models.Notification{
				UserID:  testUser.ID,
				Type:    models.NotificationTypeAssessmentDeadline,
				Title:   "Assessment Due Soon",
				Message: "Your take-home project is due in 3 days.",
				Link:    testutil.StringPtr("/applications/123/assessments/456"),
			}

			created, err := notifRepo.Create(notification)

			require.NoError(t, err)
			require.NotNil(t, created)
			assert.NotNil(t, created.Link)
			assert.Equal(t, "/applications/123/assessments/456", *created.Link)
		})
	})

	t.Run("GetByID", func(t *testing.T) {
		notification := &models.Notification{
			UserID:  testUser.ID,
			Type:    models.NotificationTypeSystemAlert,
			Title:   "System Maintenance",
			Message: "Scheduled maintenance tonight.",
		}
		created, err := notifRepo.Create(notification)
		require.NoError(t, err)

		t.Run("Found", func(t *testing.T) {
			retrieved, err := notifRepo.GetByID(created.ID, testUser.ID)

			require.NoError(t, err)
			require.NotNil(t, retrieved)
			assert.Equal(t, created.ID, retrieved.ID)
			assert.Equal(t, "System Maintenance", retrieved.Title)
			assert.Equal(t, "Scheduled maintenance tonight.", retrieved.Message)
		})

		t.Run("NotFound", func(t *testing.T) {
			retrieved, err := notifRepo.GetByID(uuid.New(), testUser.ID)

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})

		t.Run("WrongUser", func(t *testing.T) {
			retrieved, err := notifRepo.GetByID(created.ID, testUser2.ID)

			require.Error(t, err)
			assert.Nil(t, retrieved)
		})
	})

	t.Run("ListByUserID", func(t *testing.T) {
		isolatedUser, err := userRepo.CreateUser("notiflist@example.com", "List Test User", string(hashedPassword))
		require.NoError(t, err)

		for i := 0; i < 5; i++ {
			_, err := notifRepo.Create(&models.Notification{
				UserID:  isolatedUser.ID,
				Type:    models.NotificationTypeInterviewReminder,
				Title:   "Notification",
				Message: "Test message",
			})
			require.NoError(t, err)
			// Ensure distinct created_at timestamps
			time.Sleep(10 * time.Millisecond)
		}

		t.Run("ReturnsAllUserNotifications", func(t *testing.T) {
			list, err := notifRepo.ListByUserID(isolatedUser.ID, nil, 50)

			require.NoError(t, err)
			assert.Len(t, list, 5)
		})

		t.Run("SortedByCreatedAtDesc", func(t *testing.T) {
			list, err := notifRepo.ListByUserID(isolatedUser.ID, nil, 50)

			require.NoError(t, err)
			require.GreaterOrEqual(t, len(list), 2)

			for i := 0; i < len(list)-1; i++ {
				assert.True(t, list[i].CreatedAt.After(list[i+1].CreatedAt) || list[i].CreatedAt.Equal(list[i+1].CreatedAt))
			}
		})

		t.Run("FilterByReadTrue", func(t *testing.T) {
			_, err := notifRepo.MarkAsRead(
				func() uuid.UUID {
					list, _ := notifRepo.ListByUserID(isolatedUser.ID, nil, 1)
					return list[0].ID
				}(),
				isolatedUser.ID,
			)
			require.NoError(t, err)

			readTrue := true
			list, err := notifRepo.ListByUserID(isolatedUser.ID, &readTrue, 50)

			require.NoError(t, err)
			assert.NotEmpty(t, list)
			for _, n := range list {
				assert.True(t, n.Read)
			}
		})

		t.Run("FilterByReadFalse", func(t *testing.T) {
			readFalse := false
			list, err := notifRepo.ListByUserID(isolatedUser.ID, &readFalse, 50)

			require.NoError(t, err)
			assert.NotEmpty(t, list)
			for _, n := range list {
				assert.False(t, n.Read)
			}
		})

		t.Run("RespectsLimit", func(t *testing.T) {
			list, err := notifRepo.ListByUserID(isolatedUser.ID, nil, 2)

			require.NoError(t, err)
			assert.Len(t, list, 2)
		})

		t.Run("DefaultLimitWhenZero", func(t *testing.T) {
			list, err := notifRepo.ListByUserID(isolatedUser.ID, nil, 0)

			require.NoError(t, err)
			assert.LessOrEqual(t, len(list), 20)
		})

		t.Run("ReturnsEmptySliceNotNil", func(t *testing.T) {
			emptyUser, err := userRepo.CreateUser("notifempty@example.com", "Empty User", string(hashedPassword))
			require.NoError(t, err)

			list, err := notifRepo.ListByUserID(emptyUser.ID, nil, 50)

			require.NoError(t, err)
			assert.NotNil(t, list)
			assert.Empty(t, list)
		})
	})

	t.Run("GetUnreadCount", func(t *testing.T) {
		countUser, err := userRepo.CreateUser("notifcount@example.com", "Count User", string(hashedPassword))
		require.NoError(t, err)

		for i := 0; i < 3; i++ {
			_, err := notifRepo.Create(&models.Notification{
				UserID:  countUser.ID,
				Type:    models.NotificationTypeSystemAlert,
				Title:   "Alert",
				Message: "Test alert",
			})
			require.NoError(t, err)
		}

		t.Run("CorrectCount", func(t *testing.T) {
			count, err := notifRepo.GetUnreadCount(countUser.ID)

			require.NoError(t, err)
			assert.Equal(t, 3, count)
		})

		t.Run("ZeroWhenAllRead", func(t *testing.T) {
			_, err := notifRepo.MarkAllAsRead(countUser.ID)
			require.NoError(t, err)

			count, err := notifRepo.GetUnreadCount(countUser.ID)

			require.NoError(t, err)
			assert.Equal(t, 0, count)
		})
	})

	t.Run("MarkAsRead", func(t *testing.T) {
		notification := &models.Notification{
			UserID:  testUser.ID,
			Type:    models.NotificationTypeInterviewReminder,
			Title:   "Mark Read Test",
			Message: "This will be marked as read.",
		}
		created, err := notifRepo.Create(notification)
		require.NoError(t, err)
		assert.False(t, created.Read)

		t.Run("Success", func(t *testing.T) {
			updated, err := notifRepo.MarkAsRead(created.ID, testUser.ID)

			require.NoError(t, err)
			require.NotNil(t, updated)
			assert.True(t, updated.Read)
			assert.Equal(t, created.ID, updated.ID)
		})

		t.Run("WrongUser", func(t *testing.T) {
			newNotif, err := notifRepo.Create(&models.Notification{
				UserID:  testUser.ID,
				Type:    models.NotificationTypeSystemAlert,
				Title:   "Wrong User Read Test",
				Message: "Should not be readable by user 2.",
			})
			require.NoError(t, err)

			updated, err := notifRepo.MarkAsRead(newNotif.ID, testUser2.ID)

			require.Error(t, err)
			assert.Nil(t, updated)
		})
	})

	t.Run("MarkAllAsRead", func(t *testing.T) {
		markAllUser, err := userRepo.CreateUser("notifmarkall@example.com", "Mark All User", string(hashedPassword))
		require.NoError(t, err)

		for i := 0; i < 4; i++ {
			_, err := notifRepo.Create(&models.Notification{
				UserID:  markAllUser.ID,
				Type:    models.NotificationTypeAssessmentDeadline,
				Title:   "Deadline",
				Message: "Assessment due soon.",
			})
			require.NoError(t, err)
		}

		t.Run("MarksAllUnreadAsRead", func(t *testing.T) {
			count, err := notifRepo.MarkAllAsRead(markAllUser.ID)

			require.NoError(t, err)
			assert.Equal(t, 4, count)

			unreadCount, err := notifRepo.GetUnreadCount(markAllUser.ID)
			require.NoError(t, err)
			assert.Equal(t, 0, unreadCount)
		})

		t.Run("ReturnsZeroWhenAlreadyAllRead", func(t *testing.T) {
			count, err := notifRepo.MarkAllAsRead(markAllUser.ID)

			require.NoError(t, err)
			assert.Equal(t, 0, count)
		})
	})

	t.Run("ExistsByLink", func(t *testing.T) {
		link := "/applications/999/interviews/888"
		_, err := notifRepo.Create(&models.Notification{
			UserID:  testUser.ID,
			Type:    models.NotificationTypeInterviewReminder,
			Title:   "Link Test",
			Message: "Notification with link.",
			Link:    testutil.StringPtr(link),
		})
		require.NoError(t, err)

		t.Run("TrueWhenExists", func(t *testing.T) {
			exists, err := notifRepo.ExistsByLink(testUser.ID, link)

			require.NoError(t, err)
			assert.True(t, exists)
		})

		t.Run("FalseWhenNotExists", func(t *testing.T) {
			exists, err := notifRepo.ExistsByLink(testUser.ID, "/nonexistent/link")

			require.NoError(t, err)
			assert.False(t, exists)
		})

		t.Run("FalseForDifferentUser", func(t *testing.T) {
			exists, err := notifRepo.ExistsByLink(testUser2.ID, link)

			require.NoError(t, err)
			assert.False(t, exists)
		})
	})

	t.Run("UserScoping", func(t *testing.T) {
		_, err := notifRepo.Create(&models.Notification{
			UserID:  testUser.ID,
			Type:    models.NotificationTypeSystemAlert,
			Title:   "User A Only",
			Message: "This belongs to user A.",
		})
		require.NoError(t, err)

		_, err = notifRepo.Create(&models.Notification{
			UserID:  testUser2.ID,
			Type:    models.NotificationTypeSystemAlert,
			Title:   "User B Only",
			Message: "This belongs to user B.",
		})
		require.NoError(t, err)

		t.Run("UserACannotSeeUserBNotifications", func(t *testing.T) {
			listA, err := notifRepo.ListByUserID(testUser.ID, nil, 100)
			require.NoError(t, err)

			for _, n := range listA {
				assert.Equal(t, testUser.ID, n.UserID)
			}
		})

		t.Run("UserBCannotSeeUserANotifications", func(t *testing.T) {
			listB, err := notifRepo.ListByUserID(testUser2.ID, nil, 100)
			require.NoError(t, err)

			for _, n := range listB {
				assert.Equal(t, testUser2.ID, n.UserID)
			}
		})
	})
}
