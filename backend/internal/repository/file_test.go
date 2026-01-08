package repository

import (
	"ditto-backend/internal/models"
	"ditto-backend/internal/testutil"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestFileRepository(t *testing.T) {
	// Setup test database
	db := testutil.NewTestDatabase(t)
	defer db.Close(t)
	db.RunMigrations(t)

	// Create repositories
	userRepo := NewUserRepository(db.Database)
	companyRepo := NewCompanyRepository(db.Database)
	jobRepo := NewJobRepository(db.Database)
	applicationRepo := NewApplicationRepository(db.Database)
	fileRepo := NewFileRepository(db.Database)

	// Create test user
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	require.NoError(t, err)
	testUser, err := userRepo.CreateUser("filetest@example.com", "File Test User", string(hashedPassword))
	require.NoError(t, err)
	require.NotNil(t, testUser)

	// Create second user for security testing
	testUser2, err := userRepo.CreateUser("filetest2@example.com", "File Test User 2", string(hashedPassword))
	require.NoError(t, err)
	require.NotNil(t, testUser2)

	// Create test company
	testCompany := testutil.CreateTestCompany("Test Company", "test.com")
	createdCompany, err := companyRepo.CreateCompany(testCompany)
	require.NoError(t, err)
	require.NotNil(t, createdCompany)

	// Create test job
	testJob := testutil.CreateTestJob(createdCompany.ID, "Software Engineer", "Test job description")
	createdJob, err := jobRepo.CreateJob(testUser.ID, testJob)
	require.NoError(t, err)
	require.NotNil(t, createdJob)

	// Get a valid application status ID
	var statusID uuid.UUID
	err = db.Get(&statusID, "SELECT id FROM application_status LIMIT 1")
	require.NoError(t, err)

	// Create test application
	testApp := testutil.CreateTestApplication(testUser.ID, createdJob.ID, statusID)
	createdApp, err := applicationRepo.CreateApplication(testUser.ID, testApp)
	require.NoError(t, err)
	require.NotNil(t, createdApp)

	// Create second application for user2
	testApp2 := testutil.CreateTestApplication(testUser2.ID, createdJob.ID, statusID)
	createdApp2, err := applicationRepo.CreateApplication(testUser2.ID, testApp2)
	require.NoError(t, err)
	require.NotNil(t, createdApp2)

	t.Run("CreateFile", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			file := &models.File{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				FileName:      "resume.pdf",
				FileType:      "application/pdf",
				FileSize:      1024000,
				S3Key:         testUser.ID.String() + "/test-resume.pdf",
			}

			createdFile, err := fileRepo.CreateFile(file)

			require.NoError(t, err)
			require.NotNil(t, createdFile)
			assert.NotEqual(t, uuid.Nil, createdFile.ID)
			assert.Equal(t, "resume.pdf", createdFile.FileName)
			assert.Equal(t, "application/pdf", createdFile.FileType)
			assert.Equal(t, int64(1024000), createdFile.FileSize)
			assert.Equal(t, createdApp.ID, createdFile.ApplicationID)
			assert.False(t, createdFile.CreatedAt.IsZero())
			assert.False(t, createdFile.UpdatedAt.IsZero())
			assert.False(t, createdFile.UploadedAt.IsZero())
		})

		// Note: WithInterviewID test skipped - interviews table not part of Story 1.2
		// Will be tested when Interview feature is implemented in Epic 2
	})

	t.Run("GetFileByID", func(t *testing.T) {
		// Create a file first
		file := &models.File{
			UserID:        testUser.ID,
			ApplicationID: createdApp.ID,
			FileName:      "test_get.pdf",
			FileType:      "application/pdf",
			FileSize:      2048000,
			S3Key:         testUser.ID.String() + "/test-get.pdf",
		}
		createdFile, err := fileRepo.CreateFile(file)
		require.NoError(t, err)

		t.Run("Success", func(t *testing.T) {
			retrievedFile, err := fileRepo.GetFileByID(createdFile.ID, testUser.ID)

			require.NoError(t, err)
			require.NotNil(t, retrievedFile)
			assert.Equal(t, createdFile.ID, retrievedFile.ID)
			assert.Equal(t, "test_get.pdf", retrievedFile.FileName)
			assert.Equal(t, int64(2048000), retrievedFile.FileSize)
		})

		t.Run("NotFound", func(t *testing.T) {
			nonExistentID := uuid.New()
			retrievedFile, err := fileRepo.GetFileByID(nonExistentID, testUser.ID)

			require.Error(t, err)
			assert.Nil(t, retrievedFile)
		})

		t.Run("Security_CannotGetOtherUsersFile", func(t *testing.T) {
			// Create file for user2
			file2 := &models.File{
				UserID:        testUser2.ID,
				ApplicationID: createdApp2.ID,
				FileName:      "user2_file.pdf",
				FileType:      "application/pdf",
				FileSize:      1024,
				S3Key:         testUser2.ID.String() + "/user2-file.pdf",
			}
			createdFile2, err := fileRepo.CreateFile(file2)
			require.NoError(t, err)

			// Try to get user2's file as user1
			retrievedFile, err := fileRepo.GetFileByID(createdFile2.ID, testUser.ID)

			require.Error(t, err)
			assert.Nil(t, retrievedFile)
		})
	})

	t.Run("GetUserFiles", func(t *testing.T) {
		// Create multiple files for testing
		files := []*models.File{
			{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				FileName:      "file1.pdf",
				FileType:      "application/pdf",
				FileSize:      1000,
				S3Key:         testUser.ID.String() + "/file1.pdf",
			},
			{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				FileName:      "file2.docx",
				FileType:      "application/docx", // Shortened for test
				FileSize:      2000,
				S3Key:         testUser.ID.String() + "/file2.docx",
			},
			{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				FileName:      "file3.txt",
				FileType:      "text/plain",
				FileSize:      500,
				S3Key:         testUser.ID.String() + "/file3.txt",
			},
		}

		for _, file := range files {
			_, err := fileRepo.CreateFile(file)
			require.NoError(t, err)
		}

		t.Run("GetAllUserFiles", func(t *testing.T) {
			userFiles, err := fileRepo.GetUserFiles(testUser.ID, nil, nil)

			require.NoError(t, err)
			assert.GreaterOrEqual(t, len(userFiles), 3, "Should have at least 3 files")
			// Verify files are ordered by uploaded_at DESC
			for i := 0; i < len(userFiles)-1; i++ {
				assert.True(t, userFiles[i].UploadedAt.After(userFiles[i+1].UploadedAt) || userFiles[i].UploadedAt.Equal(userFiles[i+1].UploadedAt))
			}
		})

		t.Run("FilterByApplicationID", func(t *testing.T) {
			userFiles, err := fileRepo.GetUserFiles(testUser.ID, &createdApp.ID, nil)

			require.NoError(t, err)
			assert.GreaterOrEqual(t, len(userFiles), 3)
			// Verify all files belong to the application
			for _, file := range userFiles {
				assert.Equal(t, createdApp.ID, file.ApplicationID)
			}
		})

		t.Run("EmptyResultForNewUser", func(t *testing.T) {
			newUser, err := userRepo.CreateUser("newfileuser@example.com", "New File User", string(hashedPassword))
			require.NoError(t, err)

			userFiles, err := fileRepo.GetUserFiles(newUser.ID, nil, nil)

			require.NoError(t, err)
			assert.Empty(t, userFiles)
		})

		t.Run("ExcludesDeletedFiles", func(t *testing.T) {
			// Create a file and then soft delete it
			fileToDelete := &models.File{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				FileName:      "to_delete.pdf",
				FileType:      "application/pdf",
				FileSize:      1500,
				S3Key:         testUser.ID.String() + "/to_delete.pdf",
			}
			createdFileToDelete, err := fileRepo.CreateFile(fileToDelete)
			require.NoError(t, err)

			// Get count before deletion
			filesBefore, err := fileRepo.GetUserFiles(testUser.ID, nil, nil)
			require.NoError(t, err)
			countBefore := len(filesBefore)

			// Soft delete
			err = fileRepo.SoftDeleteFile(createdFileToDelete.ID, testUser.ID)
			require.NoError(t, err)

			// Get count after deletion
			filesAfter, err := fileRepo.GetUserFiles(testUser.ID, nil, nil)
			require.NoError(t, err)
			countAfter := len(filesAfter)

			assert.Equal(t, countBefore-1, countAfter, "Deleted file should not appear in results")
		})

		t.Run("DoesNotReturnOtherUsersFiles", func(t *testing.T) {
			userFiles, err := fileRepo.GetUserFiles(testUser.ID, nil, nil)
			require.NoError(t, err)

			// Verify all files belong to testUser
			for _, file := range userFiles {
				assert.Equal(t, testUser.ID, file.UserID)
			}
		})
	})

	t.Run("SoftDeleteFile", func(t *testing.T) {
		t.Run("Success", func(t *testing.T) {
			file := &models.File{
				UserID:        testUser.ID,
				ApplicationID: createdApp.ID,
				FileName:      "to_soft_delete.pdf",
				FileType:      "application/pdf",
				FileSize:      3000,
				S3Key:         testUser.ID.String() + "/to_soft_delete.pdf",
			}
			createdFile, err := fileRepo.CreateFile(file)
			require.NoError(t, err)

			// Soft delete
			err = fileRepo.SoftDeleteFile(createdFile.ID, testUser.ID)

			require.NoError(t, err)

			// Verify file cannot be retrieved
			retrievedFile, err := fileRepo.GetFileByID(createdFile.ID, testUser.ID)
			require.Error(t, err)
			assert.Nil(t, retrievedFile)
		})

		t.Run("NonExistentFile", func(t *testing.T) {
			nonExistentID := uuid.New()

			err := fileRepo.SoftDeleteFile(nonExistentID, testUser.ID)

			require.Error(t, err)
		})

		t.Run("Security_CannotDeleteOtherUsersFile", func(t *testing.T) {
			// Create file for user2
			file2 := &models.File{
				UserID:        testUser2.ID,
				ApplicationID: createdApp2.ID,
				FileName:      "user2_to_delete.pdf",
				FileType:      "application/pdf",
				FileSize:      4000,
				S3Key:         testUser2.ID.String() + "/user2-to-delete.pdf",
			}
			createdFile2, err := fileRepo.CreateFile(file2)
			require.NoError(t, err)

			// Try to delete user2's file as user1
			err = fileRepo.SoftDeleteFile(createdFile2.ID, testUser.ID)

			require.Error(t, err)

			// Verify file still exists for user2
			retrievedFile, err := fileRepo.GetFileByID(createdFile2.ID, testUser2.ID)
			require.NoError(t, err)
			assert.NotNil(t, retrievedFile)
		})
	})

	t.Run("GetUserStorageUsage", func(t *testing.T) {
		// Create a new user for storage testing
		storageTestUser, err := userRepo.CreateUser("storagetest@example.com", "Storage Test User", string(hashedPassword))
		require.NoError(t, err)

		// Create test job for storage user
		storageJob := testutil.CreateTestJob(createdCompany.ID, "Test Job", "Description")
		createdStorageJob, err := jobRepo.CreateJob(storageTestUser.ID, storageJob)
		require.NoError(t, err)

		// Create test application for storage user
		storageApp := testutil.CreateTestApplication(storageTestUser.ID, createdStorageJob.ID, statusID)
		createdStorageApp, err := applicationRepo.CreateApplication(storageTestUser.ID, storageApp)
		require.NoError(t, err)

		t.Run("EmptyForNewUser", func(t *testing.T) {
			usage, err := fileRepo.GetUserStorageUsage(storageTestUser.ID)

			require.NoError(t, err)
			assert.Equal(t, int64(0), usage)
		})

		t.Run("SingleFile", func(t *testing.T) {
			file := &models.File{
				UserID:        storageTestUser.ID,
				ApplicationID: createdStorageApp.ID,
				FileName:      "storage1.pdf",
				FileType:      "application/pdf",
				FileSize:      5000,
				S3Key:         storageTestUser.ID.String() + "/storage1.pdf",
			}
			_, err := fileRepo.CreateFile(file)
			require.NoError(t, err)

			usage, err := fileRepo.GetUserStorageUsage(storageTestUser.ID)

			require.NoError(t, err)
			assert.Equal(t, int64(5000), usage)
		})

		t.Run("MultipleFiles", func(t *testing.T) {
			files := []*models.File{
				{
					UserID:        storageTestUser.ID,
					ApplicationID: createdStorageApp.ID,
					FileName:      "storage2.pdf",
					FileType:      "application/pdf",
					FileSize:      10000,
					S3Key:         storageTestUser.ID.String() + "/storage2.pdf",
				},
				{
					UserID:        storageTestUser.ID,
					ApplicationID: createdStorageApp.ID,
					FileName:      "storage3.pdf",
					FileType:      "application/pdf",
					FileSize:      15000,
					S3Key:         storageTestUser.ID.String() + "/storage3.pdf",
				},
			}

			for _, file := range files {
				_, err := fileRepo.CreateFile(file)
				require.NoError(t, err)
			}

			usage, err := fileRepo.GetUserStorageUsage(storageTestUser.ID)

			require.NoError(t, err)
			assert.Equal(t, int64(30000), usage) // 5000 + 10000 + 15000
		})

		t.Run("ExcludesDeletedFiles", func(t *testing.T) {
			// Create a file and delete it
			fileToDelete := &models.File{
				UserID:        storageTestUser.ID,
				ApplicationID: createdStorageApp.ID,
				FileName:      "storage_deleted.pdf",
				FileType:      "application/pdf",
				FileSize:      20000,
				S3Key:         storageTestUser.ID.String() + "/storage_deleted.pdf",
			}
			createdFileToDelete, err := fileRepo.CreateFile(fileToDelete)
			require.NoError(t, err)

			// Get usage before deletion
			usageBefore, err := fileRepo.GetUserStorageUsage(storageTestUser.ID)
			require.NoError(t, err)

			// Soft delete
			err = fileRepo.SoftDeleteFile(createdFileToDelete.ID, storageTestUser.ID)
			require.NoError(t, err)

			// Get usage after deletion
			usageAfter, err := fileRepo.GetUserStorageUsage(storageTestUser.ID)
			require.NoError(t, err)

			assert.Equal(t, usageBefore-20000, usageAfter, "Deleted file size should be subtracted from storage")
		})
	})

	t.Run("GetUserFileCount", func(t *testing.T) {
		// Create a new user for count testing
		countTestUser, err := userRepo.CreateUser("counttest@example.com", "Count Test User", string(hashedPassword))
		require.NoError(t, err)

		// Create test job for count user
		countJob := testutil.CreateTestJob(createdCompany.ID, "Test Job", "Description")
		createdCountJob, err := jobRepo.CreateJob(countTestUser.ID, countJob)
		require.NoError(t, err)

		// Create test application for count user
		countApp := testutil.CreateTestApplication(countTestUser.ID, createdCountJob.ID, statusID)
		createdCountApp, err := applicationRepo.CreateApplication(countTestUser.ID, countApp)
		require.NoError(t, err)

		t.Run("EmptyForNewUser", func(t *testing.T) {
			count, err := fileRepo.GetUserFileCount(countTestUser.ID)

			require.NoError(t, err)
			assert.Equal(t, 0, count)
		})

		t.Run("SingleFile", func(t *testing.T) {
			file := &models.File{
				UserID:        countTestUser.ID,
				ApplicationID: createdCountApp.ID,
				FileName:      "count1.pdf",
				FileType:      "application/pdf",
				FileSize:      1000,
				S3Key:         countTestUser.ID.String() + "/count1.pdf",
			}
			_, err := fileRepo.CreateFile(file)
			require.NoError(t, err)

			count, err := fileRepo.GetUserFileCount(countTestUser.ID)

			require.NoError(t, err)
			assert.Equal(t, 1, count)
		})

		t.Run("MultipleFiles", func(t *testing.T) {
			for i := 2; i <= 5; i++ {
				file := &models.File{
					UserID:        countTestUser.ID,
					ApplicationID: createdCountApp.ID,
					FileName:      "count" + string(rune(i)) + ".pdf",
					FileType:      "application/pdf",
					FileSize:      1000,
					S3Key:         countTestUser.ID.String() + "/count" + string(rune(i)) + ".pdf",
				}
				_, err := fileRepo.CreateFile(file)
				require.NoError(t, err)
			}

			count, err := fileRepo.GetUserFileCount(countTestUser.ID)

			require.NoError(t, err)
			assert.Equal(t, 5, count)
		})

		t.Run("ExcludesDeletedFiles", func(t *testing.T) {
			// Create a file and delete it
			fileToDelete := &models.File{
				UserID:        countTestUser.ID,
				ApplicationID: createdCountApp.ID,
				FileName:      "count_deleted.pdf",
				FileType:      "application/pdf",
				FileSize:      1000,
				S3Key:         countTestUser.ID.String() + "/count_deleted.pdf",
			}
			createdFileToDelete, err := fileRepo.CreateFile(fileToDelete)
			require.NoError(t, err)

			// Get count before deletion
			countBefore, err := fileRepo.GetUserFileCount(countTestUser.ID)
			require.NoError(t, err)

			// Soft delete
			err = fileRepo.SoftDeleteFile(createdFileToDelete.ID, countTestUser.ID)
			require.NoError(t, err)

			// Get count after deletion
			countAfter, err := fileRepo.GetUserFileCount(countTestUser.ID)
			require.NoError(t, err)

			assert.Equal(t, countBefore-1, countAfter, "Deleted file should not be counted")
		})
	})
}
