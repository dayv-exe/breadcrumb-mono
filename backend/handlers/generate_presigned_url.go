package handlers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"
	"log"
	"mime"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type presignRequest struct {
	FileNames []string `json:"fileNames"`
}

type validPresignedFile struct {
	FileName    string `json:"fileName"`
	ContentType string `json:"contentType"`
	MediaKey    string `json:"mediaKey"`
	UploadUrl   string `json:"uploadUrl"`
}

type invalidPresignedFile struct {
	FileName string `json:"fileName"`
	Reason   string `json:"reason"`
}

type presignResponse struct {
	ValidFiles   []validPresignedFile   `json:"validFiles"`
	InvalidFiles []invalidPresignedFile `json:"invalidFiles"`
}

func HandleGeneratePresignedUrls(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userID := utils.GetAuthUserId(req)
	if userID == "" {
		return models.UnauthorizedErrorResponse("User id not found"), nil
	}

	var body presignRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.InvalidRequestErrorResponse("Invalid request body"), nil
	}

	if len(body.FileNames) == 0 {
		return models.InvalidRequestErrorResponse("At least one file is required"), nil
	}

	if len(body.FileNames) > 10 {
		return models.InvalidRequestErrorResponse("Too many files to be uploaded at once!"), nil
	}

	presignClient := s3.NewPresignClient(utils.GetDependencies().S3Client)

	validFiles := make([]validPresignedFile, 0, len(body.FileNames))
	invalidFiles := make([]invalidPresignedFile, 0)

	for _, fileName := range body.FileNames {
		ext := strings.ToLower(filepath.Ext(fileName))
		if ext == "" {
			invalidFiles = append(invalidFiles, invalidPresignedFile{
				FileName: fileName,
				Reason:   "File has no extension",
			})
			continue
		}

		contentType := mime.TypeByExtension(ext)
		if contentType == "" {
			invalidFiles = append(invalidFiles, invalidPresignedFile{
				FileName: fileName,
				Reason:   "Unrecognized file extension",
			})
			continue
		}

		if !utils.IsAllowedMimeType(contentType) {
			invalidFiles = append(invalidFiles, invalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed",
			})
			continue
		}

		// using random file name for now
		randHash, hashErr := uuid.NewRandom()
		if hashErr != nil {
			log.Fatalf("Failed to gen random hash for media upload. ERR: %v", hashErr)
		}
		mediaKey := utils.GenerateUniqueMediaKey(randHash.String() + ext)

		presignedReq, err := presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
			Bucket:      aws.String(utils.GetDependencies().BucketName),
			Key:         aws.String(mediaKey),
			ContentType: aws.String(contentType),
		}, func(po *s3.PresignOptions) {
			po.Expires = constants.PRESIGNED_URL_EXPIRY * time.Minute
		})
		if err != nil {
			invalidFiles = append(invalidFiles, invalidPresignedFile{
				FileName: fileName,
				Reason:   "Failed to generate presigned URL",
			})
			continue
		}

		validFiles = append(validFiles, validPresignedFile{
			FileName:    fileName,
			ContentType: contentType,
			MediaKey:    mediaKey,
			UploadUrl:   presignedReq.URL,
		})
	}

	res := presignResponse{
		ValidFiles:   validFiles,
		InvalidFiles: invalidFiles,
	}

	return models.SuccessfulGetRequestResponse(res, nil), nil
}
