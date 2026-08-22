package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandlePresignCrumbMediaUrl(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userid := utils.GetAuthenticatedUserid()

	var body models.PresignRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.InvalidRequestErrorResponse("Invalid request body"), nil
	}

	nonCompositeCrumbId := body.CrumbNonCompositeId

	if len(strings.TrimSpace(nonCompositeCrumbId)) < 5 {
		return models.InvalidRequestErrorResponse("Invalid non-composite id!"), nil
	}

	if len(body.Files) == 0 {
		return models.InvalidRequestErrorResponse("At least one file is required"), nil
	}

	if len(body.Files) > constants.MAX_UPLOAD_AMOUNT {
		return models.InvalidRequestErrorResponse("Too many files to be uploaded at once!"), nil
	}

	s3Helper := helpers.NewS3Helper(ctx)

	validFiles := make([]models.ValidPresignedMediaItem, 0)

	for _, file := range body.Files {

		// get the key
		media, err := utils.GenerateMediaKey(userid, nonCompositeCrumbId, file.MediaFileName, false)
		if err != nil {
			return models.ServerSideErrorResponse("Failed to generate key for media", err), nil
		}

		// sign the url
		presignedMediaUploads, err := s3Helper.PresignUrl(
			helpers.PresignUrlInput{Key: media.Key, ContentType: media.ContentType},
		)
		if err != nil {
			return models.ServerSideErrorResponse("Failed to generate upload url for media", err), nil
		}

		// create the file to send back to client
		presignedMediaFile := models.ValidPresignedFile{
			FileName:    file.MediaFileName,
			ContentType: media.ContentType,
			MediaKey:    media.Key,
			UploadUrl:   presignedMediaUploads.URL,
			Fields:      presignedMediaUploads.Values,
		}

		// THUMBNAIL
		if strings.TrimSpace(file.ThumbnailFileName) != "" {
			// get the key
			thumbnail, err := utils.GenerateMediaKey(userid, nonCompositeCrumbId, file.ThumbnailFileName, true)
			if err != nil {
				return models.ServerSideErrorResponse("Failed to generate key for thumbnail", err), nil
			}

			// sign the key
			presignedThumbnailUpload, err := s3Helper.PresignUrl(
				helpers.PresignUrlInput{Key: thumbnail.Key, ContentType: thumbnail.ContentType},
			)
			if err != nil {
				return models.ServerSideErrorResponse("Failed to generate upload url for thumbnail", err), nil
			}

			// add key to be sent
			presignedThumbnailFile := models.ValidPresignedFile{
				FileName:    file.ThumbnailFileName,
				ContentType: thumbnail.ContentType,
				MediaKey:    thumbnail.Key,
				UploadUrl:   presignedThumbnailUpload.URL,
				Fields:      presignedThumbnailUpload.Values,
			}

			validFiles = append(validFiles,
				models.ValidPresignedMediaItem{
					Index:         file.Index,
					MediaFile:     presignedMediaFile,
					ThumbnailFile: presignedThumbnailFile,
					Caption:       file.Caption,
					Type:          file.Type,
				},
			)

			continue
		}

		validFiles = append(validFiles,
			models.ValidPresignedMediaItem{
				Index:     file.Index,
				MediaFile: presignedMediaFile,
				Caption:   file.Caption,
				Type:      file.Type,
			},
		)
	}

	res := models.PresignResponse{
		ValidFiles: validFiles,
	}

	return models.SuccessfulGetRequestResponse(res, nil), nil
}
