package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

type friendReqBody struct {
	SenderId string `json:"senderId"`
}

func handleAcceptFriendRequest(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var reqBody friendReqBody
	if err := json.Unmarshal([]byte(req.Body), &reqBody); err != nil {
		return models.ServerSideErrorResponse("Failed to unmarshal accect friend request body.", err), nil
	}

	currentUserId := utils.GetAuthUserId(req)
	friendshipHelper := helpers.NewFriendshipHelper(ctx)

	if reqBody.SenderId == currentUserId {
		friendshipHelper.RejectFriendRequest(reqBody.SenderId, currentUserId)
		return models.InvalidRequestErrorResponse("You cannot be friends with yourself!"), nil
	}

	friendshipStatus, err := friendshipHelper.GetFriendshipStatus(currentUserId, reqBody.SenderId)
	if err != nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to determine friendship status!", err), nil
	}

	if friendshipStatus != constants.FRIENDSHIP_STATUS_RECEIVED {
		return models.InvalidRequestErrorResponse("Cannot accept a friend request that you haven't received!"), nil
	}

	userHelper := helpers.NewUserHelper(ctx)

	thisUser, err := userHelper.FindById(currentUserId)
	if err != nil || thisUser == nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to get this users details!", err), nil
	}

	otherUser, err := userHelper.FindById(reqBody.SenderId)
	if err != nil || otherUser == nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to get other users details!", err), nil
	}

	err = friendshipHelper.AcceptFriendRequest(thisUser, otherUser)
	if err != nil {
		return models.ServerSideErrorResponse("Unable to accept friend request, something went wrong.", err), nil
	}

	return models.SuccessfulRequestResponse(currentUserId, false), nil
}
