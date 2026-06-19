package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func handleGetCrumbs(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthenticatedUserid()

	sentCrumb := strings.ToLower(req.QueryStringParameters["sent"]) == "true"
	privateCrumb := strings.ToLower(req.QueryStringParameters["private"]) == "true"

	lastKeyParam, err := models.DecodeLastEvalKey(req.QueryStringParameters["next"])
	crumbId := strings.TrimSpace(req.QueryStringParameters["crumbId"])
	timestamp := strings.TrimSpace(req.QueryStringParameters["time"])

	var lastKey map[string]types.AttributeValue

	pk := models.CrumbSenderPrefix + userId
	gsi := models.CrumbSenderPrefix + userId
	if !sentCrumb {
		pk = models.CrumbReceiverPrefix + userId
		gsi = models.CrumbReceiverPrefix + userId
	}

	gsiSk := models.CrumbTimePrefix + timestamp + models.CrumbIdPrefix + crumbId

	if crumbId != "" && timestamp != "" {
		lastKey = map[string]types.AttributeValue{
			"pk":     &types.AttributeValueMemberS{Value: pk},
			"sk":     &types.AttributeValueMemberS{Value: models.CrumbIdPrefix + crumbId},
			"gsi2":   &types.AttributeValueMemberS{Value: gsi},
			"gsi2Sk": &types.AttributeValueMemberS{Value: gsiSk},
		}

		if sentCrumb {
			lastKey = map[string]types.AttributeValue{
				"pk":     &types.AttributeValueMemberS{Value: pk},
				"sk":     &types.AttributeValueMemberS{Value: models.CrumbIdPrefix + crumbId},
				"gsi3":   &types.AttributeValueMemberS{Value: gsi},
				"gsi3Sk": &types.AttributeValueMemberS{Value: gsiSk},
			}
		}

		if privateCrumb {
			lastKey = map[string]types.AttributeValue{
				"pk":     &types.AttributeValueMemberS{Value: models.PrivateCrumbReceiverPrefix + userId},
				"sk":     &types.AttributeValueMemberS{Value: models.CrumbIdPrefix + crumbId},
				"gsi2":   &types.AttributeValueMemberS{Value: models.PrivateCrumbReceiverPrefix + userId},
				"gsi2Sk": &types.AttributeValueMemberS{Value: gsiSk},
			}
		}
	} else {
		lastKey = lastKeyParam
	}

	log.Printf("the last key: %v", lastKey)

	if err != nil {
		return models.ServerSideErrorResponse("Failed to decode last eval key!", err), nil
	}

	result, err := helpers.NewCrumbHelper(ctx).GetCrumbs(userId, sentCrumb, lastKey)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get crumbs!", err), nil
	}

	return models.SuccessfulGetRequestResponse(result.Items, &result.LastEvaluatedKey), nil
}
