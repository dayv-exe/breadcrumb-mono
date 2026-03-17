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

type MediaItem struct {
	Index             int    `json:"index"`
	MediaFileName     string `json:"media"`
	OverlayFileName   string `json:"overlay"`
	ThumbnailFileName string `json:"thumbnail"`
	Type              string `json:"type"`
}

type ValidPresignedMediaItem struct {
	Index         int                `json:"index"`
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

func HandleGeneratePresignedUrls(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
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

	for _, file := range body.Files {
		media, invalid := presignFile(ctx, presignClient, userID, file.MediaFileName, "")
		if invalid != nil {
			invalidFiles = append(invalidFiles, *invalid)
			// dont attempt to sign anything else if base media is invalid
			continue
		}

		overlay, invalid := presignFile(ctx, presignClient, userID, file.OverlayFileName, "overlay")
		if invalid != nil {
			invalidFiles = append(invalidFiles, *invalid)
		}

		thumbnail, invalid := presignFile(ctx, presignClient, userID, file.ThumbnailFileName, "thumbnail")
		if invalid != nil {
			invalidFiles = append(invalidFiles, *invalid)
		}

		validFiles = append(validFiles, ValidPresignedMediaItem{
			Index:         file.Index,
			MediaFile:     *media,
			OverlayFile:   *overlay,
			ThumbnailFile: *thumbnail,
			Type:          file.Type,
		})
	}

	res := presignResponse{
		ValidFiles:   validFiles,
		InvalidFiles: invalidFiles,
	}

	return models.SuccessfulGetRequestResponse(res, nil), nil
}

func presignFile(ctx context.Context, presignClient *s3.PresignClient, userId, fileName, mediaLayerType string) (*validPresignedFile, *invalidPresignedFile) {
	if strings.TrimSpace(fileName) == "" {
		return nil, nil
	}

	ext := strings.ToLower(filepath.Ext(fileName))
	if ext == "" {
		return nil, &invalidPresignedFile{
			FileName: fileName,
			Reason:   "File has no extension",
		}
	}

	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		return nil, &invalidPresignedFile{
			FileName: fileName,
			Reason:   "Unrecognized file extension",
		}
	}

	switch mediaLayerType {
	case "overlay":
		if !utils.IsAllowedOverlayMimeType(contentType) {
			return nil, &invalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed for overlays",
			}
		}
	case "thumbnail":
		if !utils.IsAllowedThumbnailMimeType(contentType) {
			return nil, &invalidPresignedFile{
				FileName: fileName,
				Reason:   "File type not allowed for thumbnails",
			}
		}
	}

	if !utils.IsAllowedMimeType(contentType) {
		return nil, &invalidPresignedFile{
			FileName: fileName,
			Reason:   "File type not allowed",
		}
	}

	// using random file name for now
	randHash, hashErr := uuid.NewRandom()
	if hashErr != nil {
		log.Fatalf("Failed to gen random hash for media upload. ERR: %v", hashErr)
	}
	mediaKey := utils.GenerateUniqueMediaKey(userId, randHash.String()+ext)

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
		return nil, &invalidPresignedFile{
			FileName: fileName,
			Reason:   "Failed to generate presigned URL",
		}
	}

	return &validPresignedFile{
		FileName:    fileName,
		ContentType: contentType,
		MediaKey:    mediaKey,
		UploadUrl:   presignedReq.URL,
		Fields:      presignedReq.Values,
	}, nil
}
