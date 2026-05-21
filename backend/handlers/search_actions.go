package handlers

import (
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleSearchActions(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	placeSearch := strings.ToLower(req.QueryStringParameters["place"]) == "true"
	retrievePlace := strings.ToLower(req.QueryStringParameters["retrieve"]) == "true"
	switch strings.ToLower(req.RequestContext.HTTP.Method) {
	case "get":
		return handleSearchUser(ctx, req)
	case "post":
		if placeSearch {
			return handleSearchPlace(ctx, req)
		}
		if retrievePlace {
			return handleRetrievePlace(ctx, req)
		}
		return handleNicknameAvailable(ctx, req)
	default:
		return models.InvalidRequestErrorResponse("Invalid http method!"), nil
	}
}
