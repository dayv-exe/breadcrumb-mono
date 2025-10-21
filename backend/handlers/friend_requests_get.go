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
	friendRequests, friendRequestsErr := helpers.NewFriendshipHelper(ctx).GetAllFriendRequests(currentUserId)
	if friendRequestsErr != nil {
		return models.ServerSideErrorResponse("Failed to get friend requests!", friendRequestsErr), nil
	}
	if friendRequests == nil {
		return models.SuccessfulGetRequestResponse(nil), nil
	}

	var users []models.User

	for _, user := range *friendRequests {
		users = append(users, models.User{
			UserDisplayInfo: user,
			UserAccountInfo: models.UserAccountInfo{
				FriendshipStatus: constants.FRIENDSHIP_STATUS_RECEIVED,
			},
		})
	}

	return models.SuccessfulGetRequestResponse(users), nil
}
