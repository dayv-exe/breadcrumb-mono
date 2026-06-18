package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func handleUnsendFriendRequest(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	recipientId := req.PathParameters["id"]
	currentUserId := utils.GetAuthenticatedUserid()

	friendshipHelper := helpers.NewFriendshipHelper(ctx)

	friendshipStatus, friendshipStatusErr := friendshipHelper.GetFriendshipStatus(currentUserId, recipientId)
	if friendshipStatusErr != nil {
		return models.ServerSideErrorResponse("Failed to determine friendship status!", friendshipStatusErr), nil
	}

	if friendshipStatus != constants.FRIENDSHIP_STATUS_REQUESTED {
		return models.InvalidRequestErrorResponse("you cannot unsend a friend request that you never sent to begin with!"), nil
	}

	unsendErr := friendshipHelper.CancelFriendRequest(currentUserId, recipientId)
	if unsendErr != nil {
		return models.ServerSideErrorResponse("Failed to unsend friend request, try again!", unsendErr), nil
	}

	return models.SuccessfulRequestResponse("Friend request unsent!", false), nil
}
