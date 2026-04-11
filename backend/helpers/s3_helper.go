package helpers

import (
	"backend/utils"
	"context"

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
