package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
)

func handleGetFriends(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := req.PathParameters["id"] // the user who's friends we want to view
	lastEvalKey, err := models.DecodeLastEvalKey(req.QueryStringParameters["last"])
	if err != nil {
		return models.ServerSideErrorResponse("Failed to decode last evaluated key! Try again.", err), nil
	}

	if userId == "" {
		userId = utils.GetAuthUserId(req)
	}

	result, err := helpers.NewFriendshipHelper(ctx).GetAllFriends(userId, &lastEvalKey, aws.Int32(1))
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get friends, try again.", err), nil
	}
	if result == nil {
		return models.SuccessfulGetRequestResponse([]models.User{}, nil), nil
	}

	friendshipHelper := helpers.NewFriendshipHelper(ctx)

	var users []models.User

	for _, friend := range result.Items {
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

	return models.SuccessfulGetRequestResponse(users, &result.LastEvalKey), nil
}
