package handlers

import (
	"backend/models"
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func HandleCrumbActions(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	crumbId := req.PathParameters["id"]
	if crumbId == "" {
		return HandleGetCrumb(ctx, req)
	}
	return models.InvalidRequestErrorResponse("Not yet implemented!"), nil
}
