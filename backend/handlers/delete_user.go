package handlers

// DELETES USER FROM DYNAMO DB THEN COGNITO

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func HandleDeleteUser(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	userId := utils.GetAuthUserId(req)

	if userId == "" {
		return models.UnauthorizedErrorResponse(""), nil
	}

	// get user details from db
	dbHelper := helpers.NewUserHelper(ctx)

	user, uErr := dbHelper.FindById(userId)

	if uErr != nil {
		return models.ServerSideErrorResponse("An error occurred while trying to delete your account, try again", uErr), nil
	}

	if user == nil {
		return models.NotFoundResponse(""), nil
	}

	// delete user from dynamodb
	delErr := dbHelper.DeleteFromDynamo(user)

	if delErr != nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to delete your account, try again", delErr), nil
	}

	// delete user from cognito

	cogErr := helpers.NewCognitoHelper(ctx).DeleteFromCognito(userId, true)

	if cogErr != nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to delete your account, try again.", cogErr), nil
	}

	return models.SuccessfulRequestResponse("", false), nil
}
