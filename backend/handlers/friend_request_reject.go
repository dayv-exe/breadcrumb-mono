package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
)

func handleRejectFriendRequest(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	currentUserId := utils.GetAuthUserId(req)
	senderId := req.PathParameters["id"]
	log.Println(req.PathParameters["id"])

	friendshipStatus, friendshipStatusErr := helpers.NewFriendshipHelper(ctx).GetFriendshipStatus(currentUserId, senderId)
	if friendshipStatusErr != nil {
		return models.ServerSideErrorResponse("Failed to determine friendship status!", friendshipStatusErr), nil
	}

	if friendshipStatus != constants.FRIENDSHIP_STATUS_RECEIVED {
		log.Println(friendshipStatus)
		return models.InvalidRequestErrorResponse("No pending friend requests to reject!"), nil
	}

	err := helpers.NewFriendshipHelper(ctx).RejectFriendRequest(senderId, currentUserId)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to reject friend request, try again.", err), nil
	}

	return models.SuccessfulRequestResponse("", false), nil
}
