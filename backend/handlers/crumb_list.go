package handlers

import (
	"backend/helpers"
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func handleGetCrumbs(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {

	timestamp := strings.TrimSpace(req.QueryStringParameters["time"])
	crumbId := strings.TrimSpace(req.QueryStringParameters["id"])
	otherUser := strings.TrimSpace(req.QueryStringParameters["otherUser"])

	result, err := helpers.NewCrumbHelper(ctx).GetLatestCrumbs(
		timestamp,
		crumbId,
		otherUser,
	)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get crumbs!", err), nil
	}

	return models.SuccessfulGetRequestResponse(result.Items, &result.LastEvaluatedKey), nil
}
