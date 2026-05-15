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
	lastSk := strings.TrimSpace(req.QueryStringParameters["sk"])

	var lastKey map[string]types.AttributeValue

	pk := models.CrumbSenderPrefix + userId
	if !sentCrumb {
		pk = models.CrumbReceiverPrefix + userId
	}

	if lastSk != "" {
		lastKey = map[string]types.AttributeValue{
			"gsi2":   &types.AttributeValueMemberS{Value: pk},
			"gsi2Sk": &types.AttributeValueMemberS{Value: lastSk},
		}

		if sentCrumb {
			lastKey = map[string]types.AttributeValue{
				"gsi3":   &types.AttributeValueMemberS{Value: pk},
				"gsi3Sk": &types.AttributeValueMemberS{Value: lastSk},
			}
		}
	} else {
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
