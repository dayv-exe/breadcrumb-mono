package handlers

import (
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleFriendsActions(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch strings.ToLower(req.HTTPMethod) {
	case "post":
		return handleAcceptFriendRequest(ctx, req)

	case "get":
		return handleGetFriends(ctx, req)

	case "delete":
		return handleRemoveFriend(ctx, req)

	default:
		return models.InvalidRequestErrorResponse("Invalid http method!"), nil
	}
}
