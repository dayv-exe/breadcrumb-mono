package main

import (
	"backend/handlers"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(handlers.HandleSendCustomEmail)
}
