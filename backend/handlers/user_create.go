package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
)

type createUserRequestBody struct {
	Sub      string `json:"sub"`
	Nickname string `json:"nickname"`
	Name     string `json:"name"`
}

func abortSignup(ctx context.Context, response events.APIGatewayV2HTTPResponse, userId *string) (events.APIGatewayV2HTTPResponse, error) {
	if userId != nil {
		err := helpers.NewCognitoHelper(ctx).DeleteFromCognito(*userId, true)
		if err != nil {
			return models.ServerSideErrorResponse("failed to delete user from cognito", err), nil
		}
	}
	return response, nil
}

func handleCreateUser(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var reqBody createUserRequestBody
	if err := json.Unmarshal([]byte(req.Body), &reqBody); err != nil {
		return abortSignup(ctx, models.ServerSideErrorResponse("Failed to unmarshal request body", err), nil)
	}

	if reqBody.Sub == "" {
		return abortSignup(ctx, models.InvalidRequestErrorResponse("Sub cannot be empty"), nil)
	}

	if !utils.NameIsValid(&reqBody.Name) {
		return abortSignup(ctx, models.InvalidRequestErrorResponse(""), &reqBody.Sub)
	}

	if !utils.NicknameValid(reqBody.Nickname) {
		return abortSignup(ctx, models.InvalidRequestErrorResponse(""), &reqBody.Sub)
	}

	// check that user exists in cognito
	userInCognito, userInCognitoErr := helpers.NewCognitoHelper(ctx).UserExists(reqBody.Sub)
	if userInCognitoErr != nil {
		return abortSignup(ctx, models.ServerSideErrorResponse("failed", userInCognitoErr), &reqBody.Sub)
	}

	if !userInCognito {
		// naughty naughty!!!
		return abortSignup(ctx, models.UnauthorizedErrorResponse("Bro you need to sign up properly :("), nil)
	}

	userHelper := helpers.NewUserHelper(ctx)

	// check that user is not already in db
	nicknameAvailable, nicknameAvailableErr := userHelper.NicknameAvailable(reqBody.Nickname)
	if nicknameAvailableErr != nil {
		return abortSignup(ctx, models.ServerSideErrorResponse("Failed to search db for existing nickname", nicknameAvailableErr), &reqBody.Sub)
	}
	if !nicknameAvailable {
		return abortSignup(ctx, models.InvalidRequestErrorResponse(fmt.Sprintf("Nickname: %v is already in use!", reqBody.Nickname)), &reqBody.Sub)
	}

	userInDb, userInDbErr := userHelper.FindById(reqBody.Sub)
	if userInDbErr != nil {
		return abortSignup(ctx, models.ServerSideErrorResponse("Failed to search db for existing user", userInDbErr), &reqBody.Sub)
	}
	if userInDb != nil {
		// naughty naughty
		return abortSignup(ctx, models.UnauthorizedErrorResponse("this user already exists!"), &reqBody.Sub)
	}

	newUser := models.NewUser(reqBody.Sub, reqBody.Nickname, reqBody.Name, false)
	addUserErr := userHelper.AddUser(newUser)
	if addUserErr != nil {
		return abortSignup(ctx, models.ServerSideErrorResponse("Failed to add user to database", addUserErr), &reqBody.Sub)
	}

	return models.SuccessfulRequestResponse("Welcome to breadcrumb!", true), nil
}
