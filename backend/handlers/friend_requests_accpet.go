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

func HandleAcceptFriendRequest(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
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

	friendshipStatus, friendshipStatusErr := friendshipHelper.GetFriendshipStatus(currentUserId, reqBody.SenderId)
	if friendshipStatusErr != nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to determine friendship status!", friendshipStatusErr), nil
	}

	if friendshipStatus != constants.FRIENDSHIP_STATUS_RECEIVED {
		return models.InvalidRequestErrorResponse("Cannot accept a friend request that you haven't received!"), nil
	}

	userHelper := helpers.NewUserHelper(ctx)

	thisUser, thisUserErr := userHelper.FindById(currentUserId)
	if thisUserErr != nil || thisUser == nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to get this users details!", thisUserErr), nil
	}

	otherUser, otherUserErr := userHelper.FindById(reqBody.SenderId)
	if otherUserErr != nil || otherUser == nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to get other users details!", otherUserErr), nil
	}

	acceptErr := friendshipHelper.AcceptFriendRequest(thisUser, otherUser)
	if acceptErr != nil {
		return models.ServerSideErrorResponse("Unable to accept friend request, something went wrong.", acceptErr), nil
	}

	return models.SuccessfulRequestResponse("New friend added!", false), nil
}
