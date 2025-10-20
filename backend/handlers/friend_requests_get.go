package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func HandleGetFriendRequests(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	currentUserId := utils.GetAuthUserId(req)
	users, userErr := helpers.NewFriendshipHelper(ctx).GetAllFriendRequests(currentUserId)
	if userErr != nil {
		return models.ServerSideErrorResponse("Failed to get friend requests!", userErr), nil
	}

	var friendRequests []models.User
	for _, user := range *users {
		friendRequests = append(friendRequests, models.User{
			UserDisplayInfo: user,
			UserAccountInfo: models.UserAccountInfo{
				FriendshipStatus: constants.FRIENDSHIP_STATUS_RECEIVED,
			},
		})
	}

	return models.SuccessfulGetRequestResponse(friendRequests), nil
}
