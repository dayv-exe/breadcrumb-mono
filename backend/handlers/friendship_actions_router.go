package handlers

import (
	"backend/models"
	"backend/utils"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleFriendshipActions(context context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	action := strings.ToLower(strings.TrimSpace(utils.GetResourceName(req, 1)))
	switch action {
	default:
		return models.UnauthorizedErrorResponse("not yet implemented"), nil
	}
}
