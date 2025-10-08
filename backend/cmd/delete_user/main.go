package main

import (
	"backend/handlers/account"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter account.DeleteUserDependencies
)

func init() {
	starter = account.DeleteUserDependencies{
		Dependencies: utils.InitHandlerDependencies(utils.WithCognito(), utils.WithDatabase()),
	}
}

func main() {
	lambda.Start(starter.HandleDeleteUser)
}
