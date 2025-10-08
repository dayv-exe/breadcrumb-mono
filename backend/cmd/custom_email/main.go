package main

import (
	"backend/handlers/emails"

	"github.com/aws/aws-lambda-go/lambda"
)

func main() {
	lambda.Start(emails.Handler)
}
