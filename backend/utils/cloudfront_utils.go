package utils

import (
	"fmt"
	"strings"
)

func GetUnsignedUrlForKey(key string) string {
	if strings.TrimSpace(key) == "" {
		return ""
	}
	return fmt.Sprintf("https://%s/%s", GetDependencies().CloudFrontDomainName, key)
}
