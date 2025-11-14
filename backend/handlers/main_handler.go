package handlers

import (
	"backend/models"
	"context"
	"fmt"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func getResourceName(request events.APIGatewayV2HTTPRequest) string {
	path := request.RequestContext.HTTP.Path

	path = strings.TrimPrefix(path, "/")

	parts := strings.Split(path, "/")
	if len(parts) > 1 {
		return parts[1] // since [0] will be "/prod"
	}

	return ""
}

func HandleHandlers(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	resource := strings.ToLower(getResourceName(req))

	switch resource {
	case "friends":
		return HandleFriendsActions(ctx, req)
	case "friend-requests":
		return HandleFriendRequestActions(ctx, req)
	case "users":
		return HandleUserActions(ctx, req)
	case "search":
		return HandleSearchActions(ctx, req)

	default:
		return models.ServerSideErrorResponse("Invalid resource path!", fmt.Errorf("Invalid path. Request context: %v \n raw path: %v", req.RequestContext.HTTP.Path, req.RawPath)), nil
	}
}
