package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func handleGetCrumbs(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthUserId(req)
	sentCrumb := strings.ToLower(req.QueryStringParameters["sent"]) == "true"
	lastKeyParam, err := models.DecodeLastEvalKey(req.QueryStringParameters["next"])
	lastPk := strings.TrimSpace(req.QueryStringParameters["pk"])
	lastSk := strings.TrimSpace(req.QueryStringParameters["sk"])
	compositeLastKey := map[string]types.AttributeValue{
		"pk": &types.AttributeValueMemberS{Value: lastPk},
		"sk": &types.AttributeValueMemberS{Value: lastSk},
	}

	lastKey := compositeLastKey
	if lastPk == "" {
		lastKey = lastKeyParam
	}

	if err != nil {
		return models.ServerSideErrorResponse("Failed to decode last eval key!", err), nil
	}

	result, err := helpers.NewCrumbHelper(ctx).GetCrumbs(userId, sentCrumb, lastKey)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get crumbs!", err), nil
	}

	return models.SuccessfulGetRequestResponse(result.Items, &result.LastEvaluatedKey), nil
}
