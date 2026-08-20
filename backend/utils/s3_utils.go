package utils

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

var allowedMimeTypes = map[string]string{
	"image/jpeg":      "jpg",
	"image/png":       "png",
	"video/mp4":       "mp4",
	"video/quicktime": "mov",
	"audio/mpeg":      "mp3",
	"audio/wav":       "wav",
	"audio/ogg":       "ogg",
	"audio/mp4":       "m4a",
	"audio/aac":       "aac",
}

var allowedThumbnailMimeTypes = map[string]string{
	"image/jpeg": "jpg",
	"image/png":  "png",
}

type S3ObjectCreatedDetail struct {
	Bucket struct {
		Name string `json:"name"`
	} `json:"bucket"`
	Object struct {
		Key       string `json:"key"`
		Size      int64  `json:"size"`
		ETag      string `json:"etag"`
		Sequencer string `json:"sequencer"`
	} `json:"object"`
	Reason    string `json:"reason"`
	RequestID string `json:"request-id"`
}

func NormalizeContentType(contentType string) string {
	return strings.ToLower(strings.TrimSpace(contentType))
}

func IsAllowedMimeType(contentType string) bool {
	_, ok := allowedMimeTypes[NormalizeContentType(contentType)]
	return ok
}

func IsAllowedThumbnailMimeType(contentType string) bool {
	_, ok := allowedThumbnailMimeTypes[NormalizeContentType(contentType)]
	return ok
}

func GetExtensionFromMimeType(contentType string) string {
	if ext, ok := allowedMimeTypes[NormalizeContentType(contentType)]; ok {
		return ext
	}
	return ""
}

var DefaultDir = "uploads/unprocessed"
var ProcessedDir = "uploads/processed"

func GenerateMediaKey(userId, crumbId, fileName string) string {
	// 'uploads/unprocessed/{userid}/{crumb_id}/{file_name}'
	return fmt.Sprintf("%s/%s/%s/%s", DefaultDir, userId, crumbId, fileName)
}

func GenerateProfilePictureKey(userId, fileName string) string {
	// 'uploads/processed/{userid}/{file_name}'
	return fmt.Sprintf("%s/%s/%s", ProcessedDir, userId, fileName)
}

func GetUseridFromKey(key string) string {
	// 'uploads/unprocessed/{userid}/{crumb_id}/{file_name}'
	return strings.Split(key, "/")[2]
}
func GetCrumbNonCompositeIdFromKey(key string) string {
	// 'uploads/unprocessed/{userid}/{crumb_id}/{file_name}'
	return strings.Split(key, "/")[3]
}
func GetCrumbMediaFileNameFromKey(key string) string {
	// 'uploads/unprocessed/{userid}/{crumb_id}/{file_name}'
	return strings.Split(key, "/")[4]
}

func UnmarshalS3ObjectCreatedDetails(event events.EventBridgeEvent) (*S3ObjectCreatedDetail, error) {
	var objDet S3ObjectCreatedDetail
	if err := json.Unmarshal(event.Detail, &objDet); err != nil {
		return nil, err
	}

	return &objDet, nil
}
