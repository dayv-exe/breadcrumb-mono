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

type sendFriendReqBody struct {
	RecipientId string `json:"recipientId"`
}

func handleSendFriendRequest(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	var reqBody sendFriendReqBody
	if unmarshalErr := json.Unmarshal([]byte(req.Body), &reqBody); unmarshalErr != nil {
		return models.ServerSideErrorResponse("Failed to unmarshal send friend request body", unmarshalErr), nil
	}

	currentUserId := utils.GetAuthenticatedUserid()

	friendshipHelper := helpers.NewFriendshipHelper(ctx)

	friendshipStatus, friendshipStatusErr := friendshipHelper.GetFriendshipStatus(currentUserId, reqBody.RecipientId)
	if friendshipStatusErr != nil {
		return models.ServerSideErrorResponse("Failed to determine friendship status.", friendshipStatusErr), nil
	}

	if friendshipStatus != constants.FRIENDSHIP_STATUS_NOT_FRIENDS {
		return models.InvalidRequestErrorResponse("You can only send friend requests to people you are currently not friends with!"), nil
	}

	userHelper := helpers.NewUserHelper(ctx)

	thisUser, thisUserErr := userHelper.FindById(currentUserId)
	if thisUserErr != nil || thisUser == nil {
		return models.ServerSideErrorResponse("Failed to get current users details", thisUserErr), nil
	}

	otherUser, otherUserErr := userHelper.FindById(reqBody.RecipientId)
	if otherUserErr != nil {
		return models.ServerSideErrorResponse("Failed to get other users details", otherUserErr), nil
	}
	if otherUser == nil {
		return models.InvalidRequestErrorResponse("Recipient provided does not exist!"), nil
	}

	sendErr := friendshipHelper.SendFriendReq(thisUser, otherUser.Userid)
	if sendErr != nil {
		return models.ServerSideErrorResponse("Failed to send friend request, try again.", sendErr), nil
	}

	return models.SuccessfulRequestResponse("Friend request sent!", false), nil
}
