package handlers

import (
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleUserActions(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch strings.ToLower(req.HTTPMethod) {
	case "post":
		return handleCreateUser(ctx, req)

	case "get":
		return handleGetUser(ctx, req)

	case "put":
		return handleEditUser(ctx, req)

	case "delete":
		action := req.QueryStringParameters["action"]
		switch action {
		case "delete":
			return handleDeleteUser(ctx, req)
		case "abort":
			return handleAbortSignup(ctx, req)
		}

		return models.InvalidRequestErrorResponse("Invalid user delete action!"), nil

	default:
		return models.InvalidRequestErrorResponse("Invalid http method!"), nil
	}
}
