package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

func HandleCrumbActions(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return models.InvalidRequestErrorResponse("Invalid url"), nil
}

func handleShareCrumb(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthUserId(req)
	if userId == "" {
		return models.UnauthorizedErrorResponse("You need to be logged in to do this!"), nil
	}

	var body models.CrumbBody
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.ServerSideErrorResponse("Invalid request body!", err), nil
	}

	if body.Id == "" {
		return models.InvalidRequestErrorResponse("Crumb body must contain an id that corresponds to its media items id!"), nil
	}

	if len(body.Receivers) < 1 {
		return models.InvalidRequestErrorResponse("Crumb body must contain recipients!"), nil
	}

	if body.LocationType == "" {
		return models.InvalidRequestErrorResponse("Crumb body must contain either 'mine', 'gps', or 'friend' as location type!"), nil
	}

	helper := helpers.NewCrumbHelper(ctx)
	err := helper.SendCrumb(userId, body)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to send crumb!", err), nil
	}

	return models.SuccessfulRequestResponse("Crumb sent!", true), nil
}
