package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func handleGetCrumbs(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthUserId(req)
	sentCrumb := strings.ToLower(req.QueryStringParameters["sent"]) == "true"
	lastKey, err := models.DecodeLastEvalKey(req.QueryStringParameters["next"])
	if err != nil {
		return models.ServerSideErrorResponse("Failed to decode last eval key!", err), nil
	}

	result, err := helpers.NewCrumbHelper(ctx).GetCrumbs(userId, sentCrumb, lastKey)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get crumbs!", err), nil
	}

	return models.SuccessfulGetRequestResponse(result.Items, &result.LastEvaluatedKey), nil
}
