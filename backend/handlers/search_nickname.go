package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func handleNicknameAvailable(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {

	// returns true if a nickname has not been taken by a user in dynamodb

	// if nickname is invalid return false immediately
	nickname := strings.ToLower(req.PathParameters["str"])

	if nickname == "" || !utils.NicknameValid(nickname) {
		return models.SuccessfulRequestResponse(fmt.Sprintf("%v", false), false), nil
	}

	if utils.IsNameBanned(nickname) {
		return models.ForbiddenErrorResponse("This name is not allowed!"), nil
	}

	isAvailable, dbErr := helpers.NewUserHelper(ctx).NicknameAvailable(nickname)

	log.Println("is available: ")
	log.Println(isAvailable)

	if dbErr != nil {
		return models.ServerSideErrorResponse("An error has occurred while trying to check if nickname is available", dbErr), nil
	}

	return models.SuccessfulRequestResponse(fmt.Sprintf("%v", isAvailable), false), nil
}
