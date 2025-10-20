package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func HandleUnsendFriendRequest(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	recipientId := req.PathParameters["id"]
	currentUserId := utils.GetAuthUserId(req)

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
