package handlers

import (
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleFriendRequestActions(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	switch strings.ToLower(req.RequestContext.HTTP.Method) {
	case "get":
		return handleGetFriendRequests(ctx, req)

	case "post":
		return handleSendFriendRequest(ctx, req)

	case "delete":
		action := req.QueryStringParameters["action"]
		if action == "unsend" {
			return handleUnsendFriendRequest(ctx, req)
		}
		return handleRejectFriendRequest(ctx, req)

	default:
		return models.InvalidRequestErrorResponse("Invalid http method!"), nil
	}
}
