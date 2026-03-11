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
	"video/webm":      "webm",
	"audio/mpeg":      "mp3",
	"audio/wav":       "wav",
	"audio/ogg":       "ogg",
	"audio/mp4":       "m4a",
	"audio/aac":       "aac",
}

func NormalizeContentType(contentType string) string {
	return strings.ToLower(strings.TrimSpace(contentType))
}

func IsAllowedMimeType(contentType string) bool {
	_, ok := allowedMimeTypes[NormalizeContentType(contentType)]
	return ok
}

func GetExtensionFromMimeType(contentType string) string {
	if ext, ok := allowedMimeTypes[NormalizeContentType(contentType)]; ok {
		return ext
	}
	return ""
}

func GenerateUniqueMediaKey(fileName string) string {
	return fmt.Sprintf("media/unprocessed/%s", fileName)
}
