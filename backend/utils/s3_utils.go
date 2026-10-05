package utils

import (
	"backend/constants"
	"encoding/json"
	"fmt"
	"log"
	"mime"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/google/uuid"
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

type UnsignedKey struct {
	Key         string
	ContentType string
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

func GetMediaDirectory(userId, nonCompositeCrumbId, objectName string) string {
	// 'uploads/unprocessed/u/{userid}/c/{crumb_id}/{file_name}'
	return fmt.Sprintf("%s/u/%s/c/%s/%s", constants.DEFAULT_MEDIA_DIR, userId, nonCompositeCrumbId, objectName)
}

func GetProfilePictureDirectory(userId, objectName string, isThumbnail bool) string {
	if isThumbnail {
		// 'public/u/{userid}/{file_name}'
		return fmt.Sprintf("%s/u/%s/%s", constants.PUBLIC_MEDIA_DIR, userId, objectName)
	}

	// 'uploads/processed/u/{userid}/{file_name}'
	return fmt.Sprintf("%s/u/%s/%s", constants.PROCESSED_MEDIA_DIR, userId, objectName)
}

func GetUseridFromKey(key string) string {
	_, rest, ok := strings.Cut(key, "/u/")
	if !ok {
		return ""
	}
	id, _, _ := strings.Cut(rest, "/")
	return id
}

func GetCrumbNonCompositeIdFromKey(key string) string {
	_, rest, ok := strings.Cut(key, "/c/")
	if !ok {
		return ""
	}
	id, _, _ := strings.Cut(rest, "/")
	return id
}

func GetCrumbMediaFileNameFromKey(key string) string {
	return path.Base(key)
}

func UnmarshalS3ObjectCreatedDetails(event events.EventBridgeEvent) (*S3ObjectCreatedDetail, error) {
	var objDet S3ObjectCreatedDetail
	if err := json.Unmarshal(event.Detail, &objDet); err != nil {
		return nil, err
	}

	return &objDet, nil
}

func GenerateUUID() (string, error) {
	randHash, err := uuid.NewRandom()
	if err != nil {
		return "", err
	}
	return randHash.String(), nil
}

func getMediaObjectName(isThumbnail bool, ext string) string {
	mediaId, err := GenerateUUID()
	if err != nil {
		log.Fatalf("Failed to generate uuid for media object name! %v", err)
	}

	layer := ""
	if isThumbnail {
		layer = "thumbnail"
	}
	return fmt.Sprintf("%s_%s%s", mediaId, layer, ext)
}

func getProfilePictureObjectName(userid string, isThumbnail bool) string {
	timestamp := time.Now().Unix()
	objectName := fmt.Sprintf("%s_%d.jpg", userid, timestamp)
	if isThumbnail {
		objectName = fmt.Sprintf("%s_%d_thumbnail.jpg", userid, timestamp)
	}

	return objectName
}

func generateKey(userid, nonCompositeCrumbId, filename string, isProfilePicture, isThumbnail bool) (UnsignedKey, error) {
	// key, contentType, error
	if strings.TrimSpace(filename) == "" {
		return UnsignedKey{
			Key:         "",
			ContentType: "",
		}, fmt.Errorf("No file name given! Filename: %v", filename)
	}

	ext := strings.ToLower(filepath.Ext(filename))

	if ext == "" && isThumbnail {
		// vid thumbnail from app does not always have ext in file name
		// it is always jpg
		ext = ".jpg"
	}

	if ext == "" {
		return UnsignedKey{
			Key:         "",
			ContentType: "",
		}, fmt.Errorf("The file has no extension! Filename: %v", filename)
	}

	contentType := mime.TypeByExtension(ext)
	if contentType == "" {
		return UnsignedKey{
			Key:         "",
			ContentType: "",
		}, fmt.Errorf("Unrecognized file extension! Filename: %v", filename)
	}

	switch isThumbnail {
	case true:
		if !IsAllowedThumbnailMimeType(contentType) {
			return UnsignedKey{
				Key:         "",
				ContentType: "",
			}, fmt.Errorf("File type not allowed for thumbnails Filename: %v", filename)
		}

	default:
		if !IsAllowedMimeType(contentType) {
			return UnsignedKey{
				Key:         "",
				ContentType: "",
			}, fmt.Errorf("File type is not allowed Filename: %v", filename)
		}
	}

	var objectName string
	var key string
	if isProfilePicture {
		objectName = getProfilePictureObjectName(userid, isThumbnail)
		key = GetProfilePictureDirectory(userid, objectName, isThumbnail)
	} else {
		objectName = getMediaObjectName(isThumbnail, ext)
		key = GetMediaDirectory(userid, nonCompositeCrumbId, objectName)
	}

	return UnsignedKey{
		Key:         key,
		ContentType: contentType,
	}, nil
}

func GenerateProfilePictureKey(userid, filename string, isThumbnail bool) (UnsignedKey, error) {
	return generateKey(userid, "", filename, true, isThumbnail)
}

func GenerateMediaKey(userid, nonCompositeCrumbId, filename string, isThumbnail bool) (*UnsignedKey, error) {
	key, err := generateKey(userid, nonCompositeCrumbId, filename, false, isThumbnail)
	if err != nil {
		return nil, err
	}

	return &key, nil
}
