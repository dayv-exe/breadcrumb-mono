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

	mailbox := strings.ToLower(req.QueryStringParameters["mailbox"])

	crumbId := strings.TrimSpace(req.QueryStringParameters["crumbId"])
	timestamp := strings.TrimSpace(req.QueryStringParameters["time"])
	receiverUserid := strings.TrimSpace(req.QueryStringParameters["receiver"])

	var lastKey map[string]types.AttributeValue

	// crumbs that you received
	pkName := "pk"
	skName := "sk"
	gsiName := "gsi2"
	gsiSkName := "gsi2Sk"
	pk := models.CrumbPkPrefix + userId
	sk := models.CrumbIdPrefix + crumbId
	gsi := models.CrumbReceiverPrefix + userId
	gsiSk := models.CrumbTimePrefix + timestamp + models.CrumbIdPrefix + crumbId

	if mailbox == "sent" {
		gsiName = "gsi3"
		gsiSkName = "gsi3Sk"
		pk = models.CrumbPkPrefix + receiverUserid
		sk = models.CrumbIdPrefix + crumbId
		gsi = models.CrumbSenderPrefix + userId
		gsiSk = models.CrumbTimePrefix + timestamp + models.CrumbIdPrefix + crumbId
	} else if mailbox == "private" {
		gsiName = "gsi3"
		gsiSkName = "gsi3Sk"
		pk = models.PrivateCrumbReceiverPrefix + userId
		sk = models.CrumbIdPrefix + crumbId
		gsi = models.CrumbSenderPrefix + userId
		gsiSk = models.CrumbTimePrefix + timestamp + models.CrumbIdPrefix + crumbId
	}
	lastKey = map[string]types.AttributeValue{
		pkName:    &types.AttributeValueMemberS{Value: pk},
		skName:    &types.AttributeValueMemberS{Value: sk},
		gsiName:   &types.AttributeValueMemberS{Value: gsi},
		gsiSkName: &types.AttributeValueMemberS{Value: gsiSk},
	}
	log.Printf("the last key: %v", lastKey)

	if mailbox == "private" {
		result, err := helpers.NewCrumbHelper(ctx).GetPrivateCrumbs(lastKey)
		if err != nil {
			return models.ServerSideErrorResponse("Failed to get crumbs!", err), nil
		}

		return models.SuccessfulGetRequestResponse(result.Items, &result.LastEvaluatedKey), nil
	}

	result, err := helpers.NewCrumbHelper(ctx).GetCrumbs(userId, mailbox == "sent", lastKey)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get crumbs!", err), nil
	}

	return models.SuccessfulGetRequestResponse(result.Items, &result.LastEvaluatedKey), nil
}
