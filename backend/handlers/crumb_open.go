package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func handleOpenCrumb(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userID := utils.GetAuthenticatedUserid()
	crumbId := strings.ToLower(req.PathParameters["id"])
	sentCrumb := strings.ToLower(strings.TrimSpace(req.QueryStringParameters["sent"])) == "true"

	if userID == "" {
		return models.UnauthorizedErrorResponse("You need to be logged in to do this!"), nil
	}

	if crumbId == "" {
		return models.InvalidRequestErrorResponse("No crumb id provided!"), nil
	}

	content, err := helpers.NewCrumbHelper(ctx).OpenCrumb(userID, crumbId, sentCrumb)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to open crumb, try again!", err), nil
	}

	return models.SuccessfulGetRequestResponse(content, nil), nil
}
