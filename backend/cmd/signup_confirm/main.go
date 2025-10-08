package main

import (
	"backend/handlers/auth"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter auth.PostConfirmationDependencies
)

func init() {
	starter = auth.PostConfirmationDependencies{
		Dependencies: utils.InitHandlerDependencies(utils.WithCognito(), utils.WithDatabase()),
	}
}

func main() {
	lambda.Start(starter.HandlePostConfirmation)
}
