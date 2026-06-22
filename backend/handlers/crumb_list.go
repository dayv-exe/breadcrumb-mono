package handlers

import (
	"backend/helpers"
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func handleGetCrumbs(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	mailbox := strings.ToLower(req.QueryStringParameters["mailbox"])

	if mailbox == "" {
		return models.InvalidRequestErrorResponse(""), nil
	}

	crumbId := strings.TrimSpace(req.QueryStringParameters["crumbId"])
	timestamp := strings.TrimSpace(req.QueryStringParameters["time"])
	receiverUserid := strings.TrimSpace(req.QueryStringParameters["receiver"])

	result, err := helpers.NewCrumbHelper(ctx).GetLatestCrumbs(
		mailbox,
		crumbId,
		receiverUserid,
		timestamp,
	)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get crumbs!", err), nil
	}

	return models.SuccessfulGetRequestResponse(result.Items, &result.LastEvaluatedKey), nil
}
