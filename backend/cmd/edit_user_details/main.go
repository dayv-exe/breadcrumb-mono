package main

import (
	"backend/handlers/account"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter account.EditUserDetailsDependency
)

func init() {
	starter = account.EditUserDetailsDependency{
		Dependencies: utils.InitHandlerDependencies(utils.WithDatabase()),
	}
}

func main() {
	lambda.Start(starter.HandleEditUserDetails)
}
