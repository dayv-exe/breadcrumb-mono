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

func handleGetFriendRequests(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	currentUserId := utils.GetAuthUserId(req)

	lastEvalKey, err := models.DecodeLastEvalKey(req.QueryStringParameters["last"])
	if err != nil {
		return models.ServerSideErrorResponse("Failed to decode last eval key!", err), nil
	}

	result, err := helpers.NewFriendshipHelper(ctx).GetAllFriendRequests(currentUserId, &lastEvalKey, aws.Int32(25))
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get friend requests!", err), nil
	}

	var users []models.User

	for _, user := range result.Items {
		users = append(users, models.User{
			UserDisplayInfo: user,
			UserAccountInfo: models.UserAccountInfo{
				FriendshipStatus: constants.FRIENDSHIP_STATUS_RECEIVED,
			},
		})
	}

	return models.SuccessfulGetRequestResponse(users, &result.LastEvalKey), nil
}
