package main

import (
	"backend/handlers"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

func init() {
	utils.InitHandlerDependencies(utils.WithDatabase(), utils.WithBucket(), utils.WithCognito(), utils.WithSecrets())
}

func main() {
	lambda.Start(func(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
		utils.ResolveAuthenticatedUser(req)
		return handlers.HandleHandlers(ctx, req)
	})
}
