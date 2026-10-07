package handlers

import (
	"backend/helpers"
	"backend/models"
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
)

type MarkerRequest struct {
	Ids []string `json:"ids"`
}

func handleGetCrumbMarkers(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	helper := helpers.NewFriendHelper(ctx)

	var body MarkerRequest

	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.InvalidRequestErrorResponse("Failed to unmarshal marker request"), nil
	}

	markers, err := helper.GetUsersMarkerDetails(body.Ids)
	if err != nil {
		return models.ServerSideErrorResponse(fmt.Sprintf("Failed to get crumb marker details! ERROR: %v", err), err), nil
	}

	return models.SuccessfulGetRequestResponse(markers, nil), nil
}
