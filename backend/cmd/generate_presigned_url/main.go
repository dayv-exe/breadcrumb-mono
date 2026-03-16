package main

import (
	"backend/handlers"
	"backend/utils"
	"mime"

	"github.com/aws/aws-lambda-go/lambda"
)

func init() {
	utils.InitHandlerDependencies(utils.WithBucket())
	mime.AddExtensionType(".mov", "video/quicktime")
	mime.AddExtensionType(".heic", "image/heic")
	mime.AddExtensionType(".heif", "image/heif")
	mime.AddExtensionType(".avif", "image/avif")
	mime.AddExtensionType(".mp4", "video/mp4")
	mime.AddExtensionType(".m4a", "audio/mp4")
}

func main() {
	lambda.Start(handlers.HandleGeneratePresignedUrls)
}
