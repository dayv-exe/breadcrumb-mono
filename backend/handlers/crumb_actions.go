package handlers

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
)

func HandleCrumbActions(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	crumbId := req.PathParameters["id"]
	if crumbId == "" {
		return handleGetCrumbs(ctx, req)
	}
	return HandleGetCrumb(ctx, req)
}
