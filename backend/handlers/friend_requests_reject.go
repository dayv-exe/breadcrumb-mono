package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func HandleRejectFriendRequest(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	currentUserId := utils.GetAuthUserId(req)
	senderId := req.PathParameters["id"]

	err := helpers.NewFriendshipHelper(ctx).RejectFriendRequest(senderId, currentUserId)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to reject friend request, try again.", err), nil
	}

	return models.SuccessfulRequestResponse("", false), nil
}
