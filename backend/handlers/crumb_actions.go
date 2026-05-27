package handlers

import (
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleCrumbActions(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	method := strings.ToLower(req.RequestContext.HTTP.Method)
	switch method {
	case "get":
		if getResourceName(req, 1) == "markers" {
			return handleGetCrumbMarkers(ctx, req)
		}
		if getResourceName(req, 2) == "open" {
			return handleOpenCrumb(ctx, req)
		}
		crumbId := req.PathParameters["id"]
		if crumbId == "" {
			return handleGetCrumbs(ctx, req)
		}
		return HandleGetCrumb(ctx, req)

	case "post":
		return handleShareCrumb(ctx, req)

	default:
		return models.InvalidRequestErrorResponse("Invalid HTTP method!"), nil
	}
}
