package main

import (
	"backend/handlers"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

func init() {
	utils.InitHandlerDependencies(utils.WithDatabase(), utils.WithCognito())
}

func main() {
	lambda.Start(handlers.HandleUserActions)
}
