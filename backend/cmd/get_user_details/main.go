package main

import (
	apis "backend/handlers/account"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter apis.GetUserDetailsDependencies
)

func init() {
	starter = apis.GetUserDetailsDependencies{
		Dependencies: utils.InitHandlerDependencies(utils.WithCognito(), utils.WithDatabase()),
	}
}

func main() {
	lambda.Start(starter.HandleGetUserDetails)
}
