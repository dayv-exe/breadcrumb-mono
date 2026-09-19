// returns all new friendship items from database starting from the last friendship item client has

package handlers

import (
	"backend/helpers"
	"backend/models"
	"context"
	"strconv"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleGetLatestFriendships(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	friendId := strings.TrimSpace(req.QueryStringParameters["friendId"])
	timestampStr := strings.TrimSpace(req.QueryStringParameters["timestamp"])
	if timestampStr == "" {
		timestampStr = "0"
	}

	timestamp, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		return models.InvalidRequestErrorResponse("Invalid timestamp!"), nil
	}

	response, err := helpers.NewFriendshipHelper(ctx).GetLatestFriendships(friendId, timestamp)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get latest friendships", err), nil
	}

	return models.SuccessfulGetRequestResponse(response.Friendships, &response.LastEvaluatedKey), nil
}
