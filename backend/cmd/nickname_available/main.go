package main

import (
	"backend/handlers/auth"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter auth.HandleNicknameAvailableDependencies
)

func init() {
	starter = auth.HandleNicknameAvailableDependencies{
		Dependencies: utils.InitHandlerDependencies(utils.WithDatabase()),
	}
}

func main() {
	lambda.Start(starter.HandleNicknameAvailable)
}
