package handlers

import (
	"backend/models"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func HandleFriendRequestActions(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch req.HTTPMethod {
	case "GET":
		return handleGetFriendRequests(ctx, req)

	case "POST":
		return handleSendFriendRequest(ctx, req)

	case "DELETE":
		action := req.QueryStringParameters["action"]
		if action == "unsend" {
			return handleUnsendFriendRequest(ctx, req)
		}
		return handleRejectFriendRequest(ctx, req)

	default:
		return models.InvalidRequestErrorResponse("Invalid http method!"), nil
	}
}
