package handlers

import (
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleSearchActions(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch strings.ToLower(req.HTTPMethod) {
	case "get":
		action := req.QueryStringParameters["action"]
		if action == "nickname" {
			return handleNicknameAvailable(ctx, req)
		}

		return handleSearchUser(ctx, req)

	default:
		return models.InvalidRequestErrorResponse("Invalid http method!"), nil
	}
}
