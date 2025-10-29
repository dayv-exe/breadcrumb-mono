package handlers

import (
	"backend/models"
	"context"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleFriendRequestActions(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	log.Printf("method is %v", req.HTTPMethod)
	switch strings.ToLower(req.HTTPMethod) {
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
