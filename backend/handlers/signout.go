package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func handleSignout(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthUserId(req)
	if userId == "" {
		return models.UnauthorizedErrorResponse("You are not signed in!"), nil
	}

	err := helpers.NewCognitoHelper(ctx).Signout(userId)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to sign out user!", err), nil
	}

	return models.SuccessfulRequestResponse("Signed out!", false), nil
}
