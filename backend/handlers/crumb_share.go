package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func handleShareCrumb(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthenticatedUserid()
	if userId == "" {
		return models.UnauthorizedErrorResponse("You need to be logged in to do this!"), nil
	}

	var body models.CrumbBody
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.ServerSideErrorResponse("Invalid request body!", err), nil
	}

	if len(strings.TrimSpace(body.NonCompositeId)) < 5 {
		return models.InvalidRequestErrorResponse("Crumb body must contain a valid non-composite id!"), nil
	}

	if len(body.Receivers) < 1 {
		return models.InvalidRequestErrorResponse("Crumb body must contain recipients!"), nil
	}

	if body.LocationSelectionManner == "" {
		return models.InvalidRequestErrorResponse("Crumb body must contain either 'mine', 'gps', or 'friend' as location type!"), nil
	}

	helper := helpers.NewCrumbHelper(ctx)
	err := helper.ShareCrumb(userId, body)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to send crumb!", err), nil
	}

	// remove draft flag from media
	draftFlagHelper := helpers.NewDraftMediaFlagHelper(ctx)
	draftFlagHelper.RemoveDraftMediaFlags(userId, body.MediaKeys)

	return models.SuccessfulRequestResponse("Crumb sent!", true), nil
}
