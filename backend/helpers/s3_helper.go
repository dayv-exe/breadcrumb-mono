package helpers

import (
	"backend/constants"
	"backend/utils"
	"context"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type s3Helper struct {
	Ctx context.Context
}

func NewS3Helper(ctx context.Context) *s3Helper {
	return &s3Helper{
		Ctx: ctx,
	}
}

func (h *s3Helper) DeleteObj(key string) error {
	input := &s3.DeleteObjectInput{
		Bucket: &utils.GetDependencies().BucketName,
		Key:    &key,
	}

	_, err := utils.GetDependencies().S3Client.DeleteObject(h.Ctx, input)
	return err
}

func (h *s3Helper) PresignedUrl(mediaKey, contentType string) (*s3.PresignedPostRequest, error) {
	presignClient := s3.NewPresignClient(utils.GetDependencies().S3Client)
	return presignClient.PresignPostObject(h.Ctx, &s3.PutObjectInput{
		Bucket:      aws.String(utils.GetDependencies().BucketName),
		Key:         aws.String(mediaKey),
		ContentType: aws.String(contentType),
	}, func(po *s3.PresignPostOptions) {
		po.Expires = constants.PRESIGNED_URL_EXPIRY * time.Minute
		po.Conditions = []any{
			[]any{"content-length-range", 0, constants.MAX_UPLOAD_SIZE},
		}
	})
}
