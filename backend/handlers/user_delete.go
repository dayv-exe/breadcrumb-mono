package handlers

// DELETES USER FROM DYNAMO DB THEN COGNITO

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func handleDeleteUser(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthUserId(req)

	if userId == "" {
		return models.UnauthorizedErrorResponse(""), nil
	}

	// get user details from db
	dbHelper := helpers.NewUserHelper(ctx)

	user, err := dbHelper.FindById(userId)

	if err != nil {
		return models.ServerSideErrorResponse("Failed to get user details", err), nil
	}

	if user == nil {
		return models.NotFoundResponse(""), nil
	}

	// delete user from dynamodb
	err = dbHelper.DeleteFromDynamo(user)

	if err != nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to delete your account, try again", err), nil
	}

	// delete user from cognito

	err = helpers.NewCognitoHelper(ctx).DeleteFromCognito(userId, true)

	if err != nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to delete your account, try again.", err), nil
	}

	return models.SuccessfulRequestResponse("", false), nil
}
