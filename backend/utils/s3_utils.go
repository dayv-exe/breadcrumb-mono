package utils

import (
	"fmt"
	"strings"
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

var allowedOverlayMimeTypes = map[string]string{
	"image/png": "png",
}

var allowedThumbnailMimeTypes = map[string]string{
	"image/jpeg": "jpg",
	"image/png":  "png",
}

func NormalizeContentType(contentType string) string {
	return strings.ToLower(strings.TrimSpace(contentType))
}

func IsAllowedMimeType(contentType string) bool {
	_, ok := allowedMimeTypes[NormalizeContentType(contentType)]
	return ok
}

func IsAllowedOverlayMimeType(contentType string) bool {
	_, ok := allowedOverlayMimeTypes[NormalizeContentType(contentType)]
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

func GenerateMediaKey(userId, crumbId, fileName string) string {
	return fmt.Sprintf("uploads/unprocessed/%s/%s/%s", userId, crumbId, fileName)
}
