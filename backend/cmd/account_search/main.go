package main

import (
	"backend/handlers/discover"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter discover.AccountSearchDependencies
)

func init() {
	starter = discover.AccountSearchDependencies{
		Dependencies: utils.InitHandlerDependencies(utils.WithDatabase()),
	}
}

func main() {
	lambda.Start(starter.HandleAccountSearch)
}
