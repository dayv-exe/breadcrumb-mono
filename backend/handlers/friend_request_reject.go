package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func handleRejectFriendRequest(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	currentUserId := utils.GetAuthenticatedUserid()
	senderId := req.PathParameters["id"]

	friendshipStatus, friendshipStatusErr := helpers.NewFriendshipHelper(ctx).GetFriendshipStatus(currentUserId, senderId)
	if friendshipStatusErr != nil {
		return models.ServerSideErrorResponse("Failed to determine friendship status!", friendshipStatusErr), nil
	}

	if friendshipStatus != constants.FRIENDSHIP_STATUS_RECEIVED {
		return models.InvalidRequestErrorResponse("No pending friend requests to reject!"), nil
	}

	err := helpers.NewFriendshipHelper(ctx).RejectFriendRequest(senderId, currentUserId)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to reject friend request, try again.", err), nil
	}

	return models.SuccessfulRequestResponse("", false), nil
}
