package s3

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGenerateS3Key(t *testing.T) {
	tests := []struct {
		name           string
		userID         uuid.UUID
		fileName       string
		expectedPrefix string
		expectedExt    string
	}{
		{
			name:           "PDF file",
			userID:         uuid.MustParse("123e4567-e89b-12d3-a456-426614174000"),
			fileName:       "resume.pdf",
			expectedPrefix: "123e4567-e89b-12d3-a456-426614174000/",
			expectedExt:    ".pdf",
		},
		{
			name:           "DOCX file",
			userID:         uuid.MustParse("987fcdeb-51a2-43d7-9876-543210fedcba"),
			fileName:       "cover_letter.docx",
			expectedPrefix: "987fcdeb-51a2-43d7-9876-543210fedcba/",
			expectedExt:    ".docx",
		},
		{
			name:           "TXT file",
			userID:         uuid.MustParse("abcdef12-3456-7890-abcd-ef1234567890"),
			fileName:       "notes.txt",
			expectedPrefix: "abcdef12-3456-7890-abcd-ef1234567890/",
			expectedExt:    ".txt",
		},
		{
			name:           "File without extension",
			userID:         uuid.MustParse("11111111-2222-3333-4444-555555555555"),
			fileName:       "noextension",
			expectedPrefix: "11111111-2222-3333-4444-555555555555/",
			expectedExt:    "",
		},
		{
			name:           "File with multiple dots",
			userID:         uuid.MustParse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
			fileName:       "my.resume.final.pdf",
			expectedPrefix: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/",
			expectedExt:    ".pdf",
		},
		{
			name:           "File with spaces",
			userID:         uuid.MustParse("12345678-1234-1234-1234-123456789012"),
			fileName:       "my resume.pdf",
			expectedPrefix: "12345678-1234-1234-1234-123456789012/",
			expectedExt:    ".pdf",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s3Key := GenerateS3Key(tt.userID, tt.fileName)

			// Verify structure: {userID}/{uuid}{extension}
			assert.True(t, strings.HasPrefix(s3Key, tt.expectedPrefix), "S3 key should start with user ID")
			assert.True(t, strings.HasSuffix(s3Key, tt.expectedExt), "S3 key should end with file extension")

			// Verify format: userID/uuid.ext
			parts := strings.Split(s3Key, "/")
			assert.Equal(t, 2, len(parts), "S3 key should have exactly 2 parts separated by /")
			assert.Equal(t, tt.userID.String(), parts[0], "First part should be user ID")

			// Second part should be UUID + extension
			filenamePart := parts[1]
			if tt.expectedExt != "" {
				// Remove extension
				filenamePart = strings.TrimSuffix(filenamePart, tt.expectedExt)
			}
			// Verify it's a valid UUID
			_, err := uuid.Parse(filenamePart)
			assert.NoError(t, err, "Filename part should be a valid UUID")
		})
	}
}

func TestGenerateS3Key_Uniqueness(t *testing.T) {
	userID := uuid.New()
	fileName := "test.pdf"

	// Generate multiple keys
	keys := make(map[string]bool)
	for i := 0; i < 100; i++ {
		key := GenerateS3Key(userID, fileName)
		assert.False(t, keys[key], "Each generated key should be unique")
		keys[key] = true
	}

	assert.Equal(t, 100, len(keys), "Should generate 100 unique keys")
}

func TestS3Service_Integration(t *testing.T) {
	// Skip if not running integration tests
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	// This test requires LocalStack to be running
	// Configuration for LocalStack
	cfg := Config{
		Region:          "us-east-1",
		Bucket:          "ditto-files-local",
		AccessKeyID:     "test",
		SecretAccessKey: "test",
		URLExpiry:       15 * time.Minute,
		Endpoint:        "http://localhost:4566",
	}

	service, err := NewS3Service(cfg)
	require.NoError(t, err, "Failed to create S3 service")
	require.NotNil(t, service)

	ctx := context.Background()
	userID := uuid.New()
	s3Key := GenerateS3Key(userID, "test.pdf")

	t.Run("GeneratePresignedPutURL", func(t *testing.T) {
		url, err := service.GeneratePresignedPutURL(ctx, s3Key, "application/pdf")

		require.NoError(t, err)
		assert.NotEmpty(t, url)
		assert.Contains(t, url, "ditto-files-local")
		assert.Contains(t, url, s3Key)
		assert.Contains(t, url, "X-Amz-Algorithm")
		assert.Contains(t, url, "X-Amz-Expires")
	})

	t.Run("GeneratePresignedGetURL", func(t *testing.T) {
		url, err := service.GeneratePresignedGetURL(ctx, s3Key)

		require.NoError(t, err)
		assert.NotEmpty(t, url)
		assert.Contains(t, url, "ditto-files-local")
		assert.Contains(t, url, s3Key)
		assert.Contains(t, url, "X-Amz-Algorithm")
	})

	t.Run("HeadObject_NotFound", func(t *testing.T) {
		nonExistentKey := GenerateS3Key(uuid.New(), "nonexistent.pdf")

		exists, err := service.HeadObject(ctx, nonExistentKey)

		require.NoError(t, err)
		assert.False(t, exists, "Non-existent file should return false")
	})

	t.Run("DeleteObject", func(t *testing.T) {
		// Try to delete a non-existent object (S3 returns success even if object doesn't exist)
		deleteKey := GenerateS3Key(uuid.New(), "to_delete.pdf")

		err := service.DeleteObject(ctx, deleteKey)

		assert.NoError(t, err, "Delete should succeed even for non-existent object")
	})
}

func TestS3Service_Config(t *testing.T) {
	t.Run("ValidConfig", func(t *testing.T) {
		cfg := Config{
			Region:          "us-east-1",
			Bucket:          "test-bucket",
			AccessKeyID:     "test-access-key",
			SecretAccessKey: "test-secret-key",
			URLExpiry:       15 * time.Minute,
		}

		service, err := NewS3Service(cfg)

		require.NoError(t, err)
		require.NotNil(t, service)
		assert.Equal(t, "test-bucket", service.bucket)
		assert.Equal(t, 15*time.Minute, service.urlExpiry)
	})

	t.Run("ConfigWithEndpoint", func(t *testing.T) {
		cfg := Config{
			Region:          "us-east-1",
			Bucket:          "test-bucket",
			AccessKeyID:     "test-access-key",
			SecretAccessKey: "test-secret-key",
			URLExpiry:       15 * time.Minute,
			Endpoint:        "http://localhost:4566",
		}

		service, err := NewS3Service(cfg)

		require.NoError(t, err)
		require.NotNil(t, service)
		assert.Equal(t, "test-bucket", service.bucket)
	})
}

func TestS3Service_URLExpiry(t *testing.T) {
	tests := []struct {
		name      string
		urlExpiry time.Duration
	}{
		{
			name:      "15 minutes",
			urlExpiry: 15 * time.Minute,
		},
		{
			name:      "1 hour",
			urlExpiry: 1 * time.Hour,
		},
		{
			name:      "5 minutes",
			urlExpiry: 5 * time.Minute,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cfg := Config{
				Region:          "us-east-1",
				Bucket:          "test-bucket",
				AccessKeyID:     "test-key",
				SecretAccessKey: "test-secret",
				URLExpiry:       tt.urlExpiry,
			}

			service, err := NewS3Service(cfg)

			require.NoError(t, err)
			assert.Equal(t, tt.urlExpiry, service.urlExpiry)
		})
	}
}

func TestGenerateS3Key_ExtensionParsing(t *testing.T) {
	tests := []struct {
		name        string
		fileName    string
		expectedExt string
	}{
		{
			name:        "Simple extension",
			fileName:    "file.pdf",
			expectedExt: ".pdf",
		},
		{
			name:        "Long extension",
			fileName:    "file.jpeg",
			expectedExt: ".jpeg",
		},
		{
			name:        "No extension",
			fileName:    "README",
			expectedExt: "",
		},
		{
			name:        "Hidden file with extension",
			fileName:    ".gitignore",
			expectedExt: ".gitignore",
		},
		{
			name:        "Multiple dots - takes last",
			fileName:    "my.file.with.dots.txt",
			expectedExt: ".txt",
		},
		{
			name:        "Uppercase extension",
			fileName:    "DOCUMENT.PDF",
			expectedExt: ".PDF",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			userID := uuid.New()
			s3Key := GenerateS3Key(userID, tt.fileName)

			if tt.expectedExt != "" {
				assert.True(t, strings.HasSuffix(s3Key, tt.expectedExt),
					"S3 key should end with expected extension: %s", tt.expectedExt)
			}

			// Verify structure
			parts := strings.Split(s3Key, "/")
			assert.Equal(t, 2, len(parts))
		})
	}
}

func TestS3Service_ContextCancellation(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	cfg := Config{
		Region:          "us-east-1",
		Bucket:          "test-bucket",
		AccessKeyID:     "test",
		SecretAccessKey: "test",
		URLExpiry:       15 * time.Minute,
		Endpoint:        "http://localhost:4566",
	}

	service, err := NewS3Service(cfg)
	require.NoError(t, err)

	t.Run("CancelledContext", func(t *testing.T) {
		ctx, cancel := context.WithCancel(context.Background())
		cancel() // Cancel immediately

		s3Key := GenerateS3Key(uuid.New(), "test.pdf")

		// These operations should handle cancelled context
		// Note: Actual behavior depends on AWS SDK implementation
		_, err := service.GeneratePresignedPutURL(ctx, s3Key, "application/pdf")
		// Operation might succeed with presigning even with cancelled context
		// as presigning is a local operation
		_ = err // We accept either success or error here

		_, err = service.GeneratePresignedGetURL(ctx, s3Key)
		_ = err // Same for GET URL
	})
}
