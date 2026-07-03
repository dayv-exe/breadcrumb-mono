package handlers

import (
	"backend/helpers"
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func handleOpenCrumb(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	crumbId := strings.TrimSpace(req.PathParameters["id"])
	otherUserId := strings.TrimSpace(req.QueryStringParameters["otherUser"])

	if crumbId == "" {
		return models.InvalidRequestErrorResponse("No crumb id provided!"), nil
	}

	content, err := helpers.NewCrumbHelper(ctx).OpenCrumb(otherUserId, crumbId)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to open crumb, try again!", err), nil
	}

	return models.SuccessfulGetRequestResponse(content, nil), nil
}
