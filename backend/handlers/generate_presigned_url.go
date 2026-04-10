package handlers

import (
	"backend/constants"
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
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
)

type MediaItem struct {
	Index             int32  `json:"index"`
	MediaFileName     string `json:"media"`
	OverlayFileName   string `json:"overlay"`
	ThumbnailFileName string `json:"thumbnail"`
	Type              string `json:"type"`
}

type ValidPresignedMediaItem struct {
	Index         int32              `json:"index"`
	CrumbId       string             `json:"crumbId"`
	MediaFile     validPresignedFile `json:"media"`
	OverlayFile   validPresignedFile `json:"overlay,omitempty"`
	ThumbnailFile validPresignedFile `json:"thumbnail,omitempty"`
	Type          string             `json:"type"`
}

type presignRequest struct {
	Files []MediaItem `json:"files"`
}

type validPresignedFile struct {
	FileName    string            `json:"fileName"`
	ContentType string            `json:"contentType"`
	MediaKey    string            `json:"mediaKey"`
	UploadUrl   string            `json:"uploadUrl"`
	Fields      map[string]string `json:"fields"`
}

type invalidPresignedFile struct {
	FileName string `json:"fileName"`
	Reason   string `json:"reason"`
}

type presignResponse struct {
	ValidFiles   []ValidPresignedMediaItem `json:"validFiles"`
	InvalidFiles []invalidPresignedFile    `json:"invalidFiles"`
}

func handleGeneratePresignedUrls(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	isProfilePicture := strings.ToLower(req.QueryStringParameters["profilePicture"]) == "true"
	userID := utils.GetAuthUserId(req)
	if userID == "" {
		return models.UnauthorizedErrorResponse("User id not found"), nil
	}

	var body presignRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.InvalidRequestErrorResponse("Invalid request body"), nil
	}

	if len(body.Files) == 0 {
		return models.InvalidRequestErrorResponse("At least one file is required"), nil
	}

	if len(body.Files) > constants.MAX_UPLOAD_AMOUNT {
		return models.InvalidRequestErrorResponse("Too many files to be uploaded at once!"), nil
	}

	presignClient := s3.NewPresignClient(utils.GetDependencies().S3Client)

	validFiles := make([]ValidPresignedMediaItem, 0, len(body.Files))
	invalidFiles := make([]invalidPresignedFile, 0)

	randHash, err := uuid.NewRandom()
	if err != nil {
		log.Fatalf("Failed to generate crumb id. ERR: %v", err)
	}

	crumbId := randHash.String()

	for _, file := range body.Files {
		randHash, err := uuid.NewRandom()
		if err != nil {
			log.Fatalf("Failed to gen random hash for media upload. ERR: %v", err)
		}

		mediaId := randHash.String()
		layer := ""
		if isProfilePicture {
			layer = "profile"
		}

		media, invalid := presignFile(ctx, presignClient, userID, file.MediaFileName, crumbId, mediaId, layer, int32(file.Index))
		if invalid != nil {
			invalidFiles = append(invalidFiles, *invalid)
			// dont attempt to sign anything else if base media is invalid
			continue
		}

		overlay, invalid := presignFile(ctx, presignClient, userID, file.OverlayFileName, crumbId, mediaId, "overlay", int32(file.Index))
		if invalid != nil {
			invalidFiles = append(invalidFiles, *invalid)
		}

		thumbnail, invalid := presignFile(ctx, presignClient, userID, file.ThumbnailFileName, crumbId, mediaId, "thumbnail", int32(file.Index))
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

	res := presignResponse{
		ValidFiles:   validFiles,
		InvalidFiles: invalidFiles,
	}

	return models.SuccessfulGetRequestResponse(res, nil), nil
}

func presignFile(ctx context.Context, presignClient *s3.PresignClient, userId, fileName, crumbId, mediaId, mediaLayerType string, index int32) (validPresignedFile, *invalidPresignedFile) {
	mediaLayerType = strings.ToLower(mediaLayerType)
	if strings.TrimSpace(fileName) == "" {
		return validPresignedFile{}, nil
	}

	ext := strings.ToLower(filepath.Ext(fileName))
	if ext == "" && mediaLayerType != "thumbnail" {
		return validPresignedFile{}, &invalidPresignedFile{
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
		return validPresignedFile{}, &invalidPresignedFile{
			FileName: fileName,
			Reason:   "Unrecognized file extension",
		}
	}

	switch mediaLayerType {
	case "overlay":
		if !utils.IsAllowedOverlayMimeType(contentType) {
			return validPresignedFile{}, &invalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed for overlays",
			}
		}
	case "thumbnail":
		if !utils.IsAllowedThumbnailMimeType(contentType) {
			return validPresignedFile{}, &invalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed for thumbnails",
			}
		}

	default:
		if !utils.IsAllowedMimeType(contentType) {
			return validPresignedFile{}, &invalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed",
			}
		}
	}

	objectName := fmt.Sprintf("%s_%d_%s%s", mediaId, index, mediaLayerType, ext)
	if mediaLayerType == "profile" {
		objectName = fmt.Sprintf("%s.jpg", userId)
	}

	// media id, media layer, media index
	mediaKey := utils.GenerateMediaKey(userId, crumbId, objectName)
	if mediaLayerType == "profile" {
		mediaKey = fmt.Sprintf("%s/%s/%s", utils.ProcessedDir, userId, objectName)
	}

	presignedReq, err := presignClient.PresignPostObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(utils.GetDependencies().BucketName),
		Key:         aws.String(mediaKey),
		ContentType: aws.String(contentType),
	}, func(po *s3.PresignPostOptions) {
		po.Expires = constants.PRESIGNED_URL_EXPIRY * time.Minute
		po.Conditions = []any{
			[]any{"content-length-range", 0, constants.MAX_UPLOAD_SIZE},
		}
	})
	if err != nil {
		log.Printf("An error occurred while trying to generate presigned url. file name: %s ERROR: %v", fileName, err)
		return validPresignedFile{}, &invalidPresignedFile{
			FileName: fileName,
			Reason:   "Failed to generate presigned URL",
		}
	}

	return validPresignedFile{
		FileName:    fileName,
		ContentType: contentType,
		MediaKey:    mediaKey,
		UploadUrl:   presignedReq.URL,
		Fields:      presignedReq.Values,
	}, nil
}
