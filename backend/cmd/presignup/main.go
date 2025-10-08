package main

import (
	"backend/handlers/auth"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter auth.PreSignupDependencies
)

func init() {
	starter = auth.PreSignupDependencies{
		Dependencies: utils.InitHandlerDependencies(utils.WithDatabase()),
	}
}

func main() {
	lambda.Start(starter.PreSignupHandler)
}
