package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandlePresignProfilePictureUrl(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userid := utils.GetAuthenticatedUserid()

	var body models.PresignRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.InvalidRequestErrorResponse("Invalid request body"), nil
	}

	if len(body.Files) == 0 {
		return models.InvalidRequestErrorResponse("At least one file is required"), nil
	}

	if len(body.Files) > 1 {
		return models.InvalidRequestErrorResponse("Too many files to be uploaded at once!"), nil
	}

	s3Helper := helpers.NewS3Helper(ctx)

	file := body.Files[0]
	validFiles := make([]models.ValidPresignedMediaItem, 0)
	// get the key
	profilePicture, err := utils.GenerateProfilePictureKey(userid, file.MediaFileName, false)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to generate key for profile picture", err), nil
	}

	// sign the url
	presignedProfilePictureUpload, err := s3Helper.PresignUrl(
		helpers.PresignUrlInput{Key: profilePicture.Key, ContentType: profilePicture.ContentType},
	)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to generate upload url for profile picture", err), nil
	}

	// create the file to send back to client
	presignedMediaFile := models.ValidPresignedFile{
		FileName:    file.MediaFileName,
		ContentType: profilePicture.ContentType,
		MediaKey:    profilePicture.Key,
		UploadUrl:   presignedProfilePictureUpload.URL,
		Fields:      presignedProfilePictureUpload.Values,
	}

	// THUMBNAIL
	if strings.TrimSpace(file.ThumbnailFileName) != "" {
		// get the key
		thumbnail, err := utils.GenerateProfilePictureKey(userid, file.ThumbnailFileName, true)
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

		res := models.PresignResponse{
			ValidFiles: validFiles,
		}
		return models.SuccessfulGetRequestResponse(res, nil), nil
	}

	validFiles = append(validFiles,
		models.ValidPresignedMediaItem{
			Index:     file.Index,
			MediaFile: presignedMediaFile,
			Caption:   file.Caption,
			Type:      file.Type,
		},
	)
	res := models.PresignResponse{
		ValidFiles: validFiles,
	}

	return models.SuccessfulGetRequestResponse(res, nil), nil
}
