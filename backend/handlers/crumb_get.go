package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleGetCrumb(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	crumbId := req.PathParameters["id"]
	userId := utils.GetAuthenticatedUserid()
	sentCrumb := strings.ToLower(req.QueryStringParameters["sent"]) == "true"
	if crumbId == "" || userId == "" {
		return models.InvalidRequestErrorResponse("Invalid request"), nil
	}

	helper := helpers.NewCrumbHelper(ctx)

	crumb, err := helper.GetCrumb(userId, crumbId, sentCrumb)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get crumb!", err), nil
	}

	return models.SuccessfulGetRequestResponse(crumb, nil), nil
}
