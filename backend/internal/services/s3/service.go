package s3

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/google/uuid"
)

type S3Service struct {
	client        *s3.Client
	presignClient *s3.PresignClient
	bucket        string
	urlExpiry     time.Duration
}

type Config struct {
	Region          string
	Bucket          string
	AccessKeyID     string
	SecretAccessKey string
	URLExpiry       time.Duration
	Endpoint        string // Add this for LocalStack
}

func NewS3Service(cfg Config) (*S3Service, error) {
	awsCfg, err := config.LoadDefaultConfig(context.TODO(), config.WithRegion(cfg.Region), config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.AccessKeyID, cfg.SecretAccessKey, "")))
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config")
	}

	var client *s3.Client
	if cfg.Endpoint != "" {
		client = s3.NewFromConfig(awsCfg, func(o *s3.Options) {
			o.BaseEndpoint = aws.String(cfg.Endpoint)
			o.UsePathStyle = true
		})
	} else {
		client = s3.NewFromConfig(awsCfg)
	}

	presignClient := s3.NewPresignClient(client)

	return &S3Service{
		client:        client,
		presignClient: presignClient,
		bucket:        cfg.Bucket,
		urlExpiry:     cfg.URLExpiry,
	}, nil
}

func GenerateS3Key(userID uuid.UUID, fileName string) string {
	fileUUID := uuid.New()

	ext := ""
	for i := len(fileName) - 1; i >= 0; i-- {
		if fileName[i] == '.' {
			ext = fileName[i:]
			break
		}
	}

	return fmt.Sprintf("%s/%s%s", userID.String(), fileUUID.String(), ext)
}

func (s *S3Service) GeneratePresignedPutURL(ctx context.Context, s3Key, contentType string) (string, error) {
	request, err := s.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(s3Key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(s.urlExpiry))
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned PUT URL: %w", err)
	}

	return request.URL, nil
}

func (s *S3Service) GeneratePresignedGetURL(ctx context.Context, s3Key string) (string, error) {
	request, err := s.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(s3Key),
	}, s3.WithPresignExpires(s.urlExpiry))
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned GET URL: %w", err)
	}

	return request.URL, nil
}

func (s *S3Service) HeadObject(ctx context.Context, s3Key string) (bool, error) {
	_, err := s.client.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(s3Key),
	})
	if err != nil {
		var nsk *types.NoSuchKey
		var nsb *types.NotFound
		if errors.As(err, &nsk) || errors.As(err, &nsb) {
			return false, nil // File doesn't exist, that's okay
		}
		return false, fmt.Errorf("failed to check object existence: %w", err)
	}

	return true, nil
}

func (s *S3Service) DeleteObject(ctx context.Context, s3Key string) error {
	_, err := s.client.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(s.bucket),
		Key:    aws.String(s3Key),
	})
	if err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}

	return nil
}
