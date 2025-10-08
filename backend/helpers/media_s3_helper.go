package helpers

import (
	"backend/constants"
	"backend/utils"
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type MediaHelper struct {
	Dependencies *utils.HandlerDependencies
	Ctx          context.Context
}

type PresignRequest struct {
	Key string `json:"key"`
}

type PresignResponse struct {
	Url string `json:"url"`
}

func (this *MediaHelper) GeneratePresignedUrl(input *PresignRequest) (*v4.PresignedHTTPRequest, error) {
	s3PresignClient := s3.NewPresignClient(this.Dependencies.S3Client)

	putReq := &s3.PutObjectInput{
		Bucket:      aws.String(this.Dependencies.BucketName),
		Key:         aws.String(input.Key),
		ContentType: aws.String("image/jpeg"),
	}

	result, err := s3PresignClient.PresignPutObject(this.Ctx, putReq, func(po *s3.PresignOptions) {
		po.Expires = constants.PRESIGNED_URL_EXPIRY * time.Minute
	})
	if err != nil {
		return nil, fmt.Errorf("Failed to generate presigned url, %v", err)
	}

	return result, nil
}
