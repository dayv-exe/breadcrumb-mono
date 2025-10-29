package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func handleGetFriends(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	userId := req.PathParameters["id"] // the user who's friends we want to view
	if userId == "" {
		userId = utils.GetAuthUserId(req)
	}

	friends, friendsErr := helpers.NewFriendshipHelper(ctx).GetAllFriends(userId)
	if friendsErr != nil {
		return models.ServerSideErrorResponse("Failed to get friends, try again.", friendsErr), nil
	}
	if friends == nil {
		return models.SuccessfulGetRequestResponse(nil), nil
	}

	friendshipHelper := helpers.NewFriendshipHelper(ctx)

	var users []models.User

	for _, friend := range *friends {
		var friendshipStatus string

		currentUser := utils.GetAuthUserId(req)
		if currentUser == userId {
			// if current user requests list of all their friends
			friendshipStatus = constants.FRIENDSHIP_STATUS_FRIENDS
		} else {
			// if user requests to view list of other users friends
			s, _ := friendshipHelper.GetFriendshipStatus(currentUser, friend.Userid)
			friendshipStatus = s
		}

		users = append(users, models.User{
			UserDisplayInfo: friend,
			UserAccountInfo: models.UserAccountInfo{
				FriendshipStatus: friendshipStatus,
			},
		})
	}

	return models.SuccessfulGetRequestResponse(users), nil
}
