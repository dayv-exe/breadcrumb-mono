package main

import (
	"backend/handlers/discover"
	"backend/utils"

	"github.com/aws/aws-lambda-go/lambda"
)

var (
	starter discover.FriendRequestDependencies
)

func init() {
	starter = discover.FriendRequestDependencies{
		Dependencies: utils.InitHandlerDependencies(utils.WithDatabase()),
	}
}

func main() {
	lambda.Start(starter.HandleFriendshipAction)
}
