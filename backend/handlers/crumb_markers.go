package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
)

func handleGetCrumbMarkers(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userid := utils.GetAuthenticatedUserid()
	helper := helpers.NewFriendshipHelper(ctx)

	markers, err := helper.GetAllFriendsCrumbMarkerDetails(userid)
	if err != nil {
		return models.ServerSideErrorResponse(fmt.Sprintf("Failed to get crumb marker details! ERROR: %v", err), err), nil
	}

	return models.SuccessfulGetRequestResponse(markers, nil), nil
}
