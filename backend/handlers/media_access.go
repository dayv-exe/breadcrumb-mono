package handlers

import (
	"backend/models"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func HandleMediaAccess(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	return models.UnauthorizedErrorResponse("Not yet implemented"), nil
}
