package handlers

import (
	"backend/models"
	"backend/utils"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleSearchActions(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	switch strings.ToLower(req.RequestContext.HTTP.Method) {
	case "get":
		action := req.QueryStringParameters["action"]
		if action == "nickname" {
			return handleNicknameAvailable(ctx, req)
		}

		if utils.GetAuthUserId(req) == "" {
			return models.UnauthorizedErrorResponse(""), nil
		}
		return handleSearchUser(ctx, req)

	default:
		return models.InvalidRequestErrorResponse("Invalid http method!"), nil
	}
}
