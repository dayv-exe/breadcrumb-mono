package handlers

import (
	"backend/helpers"
	"backend/models"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

// deletes an unverified user from cognito when the user cancels verification process on the frontend

func AbortSignupHandler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// invalid username(sub, uuid)
	userId := req.PathParameters["id"]
	if userId == "" {
		return models.InvalidRequestErrorResponse(""), nil
	}

	err := helpers.NewCognitoHelper(ctx).DeleteFromCognito(userId, true)

	if err != nil {
		return models.ServerSideErrorResponse("An error occurred while trying to remove your account.", err, "error while trying to delete user from cognito"), nil
	}

	return models.SuccessfulRequestResponse("successfully cancelled signup.", false), nil
}
