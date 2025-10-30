package handlers

import (
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleSearchActions(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	switch strings.ToLower(req.RequestContext.HTTP.Method) {
	case "get":
		return handleSearchUser(ctx, req)
	case "post":
		return handleNicknameAvailable(ctx, req)
	default:
		return models.InvalidRequestErrorResponse("Invalid http method!"), nil
	}
}
