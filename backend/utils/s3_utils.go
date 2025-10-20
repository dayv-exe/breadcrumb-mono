package utils

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

func IsValidImageExtension(ext string) bool {
	validExtensions := map[string]bool{
		"jpg":  true,
		"jpeg": true,
		"png":  true,
		"gif":  true,
		"webp": true,
	}
	return validExtensions[ext]
}

func GenerateUniqueImageKey(userID, extension string) string {
	timestamp := time.Now().Unix()
	uniqueID := uuid.New().String()[:8]

	// format: images/{userID}/{timestamp}_{uniqueID}.{ext}
	return fmt.Sprintf("images/%s/%d_%s.%s", userID, timestamp, uniqueID, extension)
}

func GenerateImageKey(userID, extension string) string {
	// format: images/{userID}.{ext}
	return fmt.Sprintf("images/%s.%s", userID, extension)
}

func GetContentType(extension string) string {
	contentTypes := map[string]string{
		"jpg":  "image/jpeg",
		"jpeg": "image/jpeg",
		"png":  "image/png",
		"gif":  "image/gif",
		"webp": "image/webp",
	}

	if ct, ok := contentTypes[extension]; ok {
		return ct
	}
	return "fake"
}
