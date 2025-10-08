package main

import (
	"backend/handlers/auth"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter auth.RemoveStaleAccountsDependencies
)

func init() {
	starter = auth.RemoveStaleAccountsDependencies{
		Dependencies: utils.InitHandlerDependencies(utils.WithCognito()),
	}
}

func main() {
	lambda.Start(starter.HandleRemoveStaleAccounts)
}
