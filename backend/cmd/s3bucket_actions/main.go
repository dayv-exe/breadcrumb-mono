package main

import (
	"backend/handlers/media"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter media.S3BucketActionsDependencies
)

func init() {
	starter = media.S3BucketActionsDependencies{
		Dependencies: utils.InitHandlerDependencies(utils.WithBucket()),
	}
}

func main() {
	lambda.Start(starter.HandleStorageActions)
}
