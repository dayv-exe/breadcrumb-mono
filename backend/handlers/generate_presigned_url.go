package handlers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

type response struct {
	UploadUrl string `json:"uploadUrl"`
	ImageKey  string `json:"imageKey"`
}

func HandleGeneratePresignedUrl(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userid := utils.GetAuthUserId(req)
	if userid == "" {
		return models.UnauthorizedErrorResponse("User id not found"), nil
	}

	fileExtension := req.QueryStringParameters["ext"]

	fileExtension = strings.ToLower(strings.TrimPrefix(fileExtension, "."))

	if !utils.IsValidImageExtension(fileExtension) {
		return models.InvalidRequestErrorResponse("Invalid image file extension. Only jpg, jpeg, png, gif, and webp are allowed!"), nil
	}

	imageKey := utils.GenerateUniqueImageKey(userid, fileExtension)

	// presign
	presignClient := s3.NewPresignClient(utils.GetDependencies().S3Client)
	presignedReq, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      &utils.GetDependencies().BucketName,
		Key:         &imageKey,
		ContentType: aws.String(utils.GetContentType(fileExtension)),
	}, func(po *s3.PresignOptions) {
		po.Expires = constants.PRESIGNED_URL_EXPIRY * time.Minute
	})
	if err != nil {
		return models.ServerSideErrorResponse("Failed to generate presigned url", err), nil
	}

	res := response{
		UploadUrl: presignedReq.URL,
		ImageKey:  imageKey,
	}

	return models.SuccessfulGetRequestResponse(res, nil), nil
}
