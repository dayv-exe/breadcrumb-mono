package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"mime"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/google/uuid"
)

type MediaItem struct {
	Index             int8             `json:"index"`
	MediaFileName     string           `json:"media"`
	OverlayFileName   string           `json:"overlay"`
	ThumbnailFileName string           `json:"thumbnail"`
	Text              models.CrumbText `json:"text"`
	Type              string           `json:"type"`
}

type ValidPresignedMediaItem struct {
	Index         int8               `json:"index"`
	CrumbId       string             `json:"crumbId"`
	MediaFile     ValidPresignedFile `json:"media,omitempty"`
	OverlayFile   ValidPresignedFile `json:"overlay,omitempty"`
	ThumbnailFile ValidPresignedFile `json:"thumbnail,omitempty"`
	Text          models.CrumbText   `json:"text,omitempty"`
	Type          string             `json:"type"`
}

type PresignRequest struct {
	Files []MediaItem `json:"files"`
}

type ValidPresignedFile struct {
	FileName    string            `json:"fileName"`
	ContentType string            `json:"contentType"`
	MediaKey    string            `json:"mediaKey"`
	UploadUrl   string            `json:"uploadUrl"`
	Fields      map[string]string `json:"fields"`
}

type InvalidPresignedFile struct {
	FileName string `json:"fileName"`
	Reason   string `json:"reason"`
}

type PresignResponse struct {
	ValidFiles   []ValidPresignedMediaItem `json:"validFiles"`
	InvalidFiles []InvalidPresignedFile    `json:"invalidFiles"`
}

func handleGeneratePresignedUrls(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	isProfilePicture := strings.ToLower(req.QueryStringParameters["profilePicture"]) == "true"
	userID := utils.GetAuthUserId(req)
	if userID == "" {
		return models.UnauthorizedErrorResponse("User id not found"), nil
	}

	var body PresignRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.InvalidRequestErrorResponse("Invalid request body"), nil
	}

	if len(body.Files) == 0 {
		return models.InvalidRequestErrorResponse("At least one file is required"), nil
	}

	if len(body.Files) > constants.MAX_UPLOAD_AMOUNT || isProfilePicture && len(body.Files) > 1 {
		return models.InvalidRequestErrorResponse("Too many files to be uploaded at once!"), nil
	}

	validFiles := make([]ValidPresignedMediaItem, 0, len(body.Files))
	invalidFiles := make([]InvalidPresignedFile, 0)

	if isProfilePicture {
		media, invalid := presignFileAsProfilePicture(ctx, userID, body.Files[0].MediaFileName, false)
		if invalid != nil {
			return models.InvalidRequestErrorResponse(fmt.Sprintf("Profile picture is invalid. ERROR: %v", invalid.Reason)), nil
		}

		thumbnail, invalid := presignFileAsProfilePicture(ctx, userID, body.Files[0].ThumbnailFileName, true)
		if invalid != nil {
			return models.InvalidRequestErrorResponse(fmt.Sprintf("Profile picture thumbnail is invalid. ERROR: %v", invalid.Reason)), nil
		}

		res := PresignResponse{
			ValidFiles: []ValidPresignedMediaItem{
				ValidPresignedMediaItem{
					MediaFile:     media,
					ThumbnailFile: thumbnail,
				},
			},
			InvalidFiles: []InvalidPresignedFile{},
		}

		return models.SuccessfulGetRequestResponse(res, nil), nil
	}

	randHash, err := uuid.NewRandom()
	if err != nil {
		log.Fatalf("Failed to generate crumb id. ERR: %v", err)
	}

	crumbId := randHash.String()

	for _, file := range body.Files {
		if strings.ToLower(file.Type) == "text" {
			// pretend to sign text, so upload flow stays same regardless of crumb type
			validFiles = append(validFiles, ValidPresignedMediaItem{
				Index:         file.Index,
				CrumbId:       crumbId,
				MediaFile:     ValidPresignedFile{},
				OverlayFile:   ValidPresignedFile{},
				ThumbnailFile: ValidPresignedFile{},
				Text:          file.Text,
				Type:          file.Type,
			})

			continue
		}

		randHash, err := uuid.NewRandom()
		if err != nil {
			log.Fatalf("Failed to gen random hash for media upload. ERR: %v", err)
		}

		mediaId := randHash.String()

		media, invalid := presignFileAsMedia(ctx, userID, crumbId, mediaId, file.MediaFileName, file.Index, "")
		if invalid != nil {
			invalidFiles = append(invalidFiles, *invalid)
			// dont attempt to sign anything else if base media is invalid
			continue
		}

		overlay, invalid := presignFileAsMedia(ctx, userID, crumbId, mediaId, file.OverlayFileName, file.Index, "overlay")
		if invalid != nil {
			invalidFiles = append(invalidFiles, *invalid)
		}

		thumbnail, invalid := presignFileAsMedia(ctx, userID, crumbId, mediaId, file.ThumbnailFileName, file.Index, "thumbnail")
		if invalid != nil {
			invalidFiles = append(invalidFiles, *invalid)
		}

		validFiles = append(validFiles, ValidPresignedMediaItem{
			Index:         file.Index,
			CrumbId:       crumbId,
			MediaFile:     media,
			OverlayFile:   overlay,
			ThumbnailFile: thumbnail,
			Type:          file.Type,
		})
	}

	res := PresignResponse{
		ValidFiles:   validFiles,
		InvalidFiles: invalidFiles,
	}

	return models.SuccessfulGetRequestResponse(res, nil), nil
}

func presignFileAsMedia(ctx context.Context, userId, crumbId, mediaId, fileName string, index int8, layer string) (ValidPresignedFile, *InvalidPresignedFile) {
	layer = strings.ToLower(layer)
	if strings.TrimSpace(fileName) == "" {
		return ValidPresignedFile{}, nil
	}

	ext := strings.ToLower(filepath.Ext(fileName))
	if ext == "" && layer != "thumbnail" {
		return ValidPresignedFile{}, &InvalidPresignedFile{
			FileName: fileName,
			Reason:   "File has no extension",
		}
	}

	if ext == "" {
		// vid thumbnail from app does not have ext in file name
		// it is always jpg
		ext = ".jpg"
	}

	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		return ValidPresignedFile{}, &InvalidPresignedFile{
			FileName: fileName,
			Reason:   "Unrecognized file extension",
		}
	}

	switch layer {
	case "overlay":
		if !utils.IsAllowedOverlayMimeType(contentType) {
			return ValidPresignedFile{}, &InvalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed for overlays",
			}
		}
	case "thumbnail":
		if !utils.IsAllowedThumbnailMimeType(contentType) {
			return ValidPresignedFile{}, &InvalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed for thumbnails",
			}
		}

	default:
		if !utils.IsAllowedMimeType(contentType) {
			return ValidPresignedFile{}, &InvalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed",
			}
		}
	}

	objectName := fmt.Sprintf("%s_%d_%s%s", mediaId, index, layer, ext)

	// media id, media layer, media index
	mediaKey := utils.GenerateMediaKey(userId, crumbId, objectName)

	presignedReq, err := helpers.NewS3Helper(ctx).PresignedUrl(mediaKey, contentType)
	if err != nil {
		log.Printf("An error occurred while trying to generate presigned url. file name: %s ERROR: %v", fileName, err)
		return ValidPresignedFile{}, &InvalidPresignedFile{
			FileName: fileName,
			Reason:   "Failed to generate presigned URL",
		}
	}

	return ValidPresignedFile{
		FileName:    fileName,
		ContentType: contentType,
		MediaKey:    mediaKey,
		UploadUrl:   presignedReq.URL,
		Fields:      presignedReq.Values,
	}, nil
}

func presignFileAsProfilePicture(ctx context.Context, userId, fileName string, isThumbnail bool) (ValidPresignedFile, *InvalidPresignedFile) {
	if strings.TrimSpace(fileName) == "" {
		return ValidPresignedFile{}, nil
	}

	ext := strings.ToLower(filepath.Ext(fileName))
	if ext == "" && !isThumbnail {
		return ValidPresignedFile{}, &InvalidPresignedFile{
			FileName: fileName,
			Reason:   "File has no extension",
		}
	}

	if ext == "" {
		// vid thumbnail from app does not have ext in file name
		// it is always jpg
		ext = ".jpg"
	}

	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		return ValidPresignedFile{}, &InvalidPresignedFile{
			FileName: fileName,
			Reason:   "Unrecognized file extension",
		}
	}

	switch isThumbnail {
	case true:
		if !utils.IsAllowedThumbnailMimeType(contentType) {
			return ValidPresignedFile{}, &InvalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed for thumbnails",
			}
		}

	default:
		if !utils.IsAllowedMimeType(contentType) {
			return ValidPresignedFile{}, &InvalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed",
			}
		}
	}

	objectName := fmt.Sprintf("%s_%d.jpg", userId, time.Now().Unix())
	if isThumbnail {
		objectName = fmt.Sprintf("%s_%d_thumbnail.jpg", userId, time.Now().Unix())
	}

	// media id, media layer, media index
	mediaKey := utils.GenerateProfilePictureKey(userId, objectName)

	presignedReq, err := helpers.NewS3Helper(ctx).PresignedUrl(mediaKey, contentType)
	if err != nil {
		log.Printf("An error occurred while trying to generate presigned url. file name: %s ERROR: %v", fileName, err)
		return ValidPresignedFile{}, &InvalidPresignedFile{
			FileName: fileName,
			Reason:   "Failed to generate presigned URL",
		}
	}

	return ValidPresignedFile{
		FileName:    fileName,
		ContentType: contentType,
		MediaKey:    mediaKey,
		UploadUrl:   presignedReq.URL,
		Fields:      presignedReq.Values,
	}, nil
}
