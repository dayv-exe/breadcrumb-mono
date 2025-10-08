package main

import (
	"backend/handlers/auth"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter auth.AbortSignupDependencies
)

func init() {
	starter = auth.AbortSignupDependencies{
		Dependencies: starter.Dependencies,
	}
}

func main() {
	lambda.Start(starter.AbortSignupHandler)
}
