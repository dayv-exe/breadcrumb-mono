package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func handleRemoveFriend(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	otherUserId := req.PathParameters["id"]
	currentUserId := utils.GetAuthUserId(req)

	if otherUserId == "" {
		return models.InvalidRequestErrorResponse("Other user id cannot be empty!"), nil
	}

	if currentUserId == "" {
		return models.UnauthorizedErrorResponse("You need to be logged in to do this!!! :("), nil
	}

	friendshipHelper := helpers.NewFriendshipHelper(ctx)

	friendshipStatus, friendshipStatusErr := friendshipHelper.GetFriendshipStatus(currentUserId, otherUserId)
	if friendshipStatusErr != nil {
		return models.ServerSideErrorResponse("Failed to determine friendship status!", friendshipStatusErr), nil
	}

	if friendshipStatus != constants.FRIENDSHIP_STATUS_FRIENDS {
		return models.InvalidRequestErrorResponse("You can only end friendships with people that you are friends with!"), nil
	}

	endErr := friendshipHelper.EndFriendship(currentUserId, otherUserId)
	if endErr != nil {
		return models.ServerSideErrorResponse("Failed to end friendship, you guys must stay friends, jk jk, just try again", endErr), nil
	}

	return models.SuccessfulRequestResponse(currentUserId, false), nil
}
