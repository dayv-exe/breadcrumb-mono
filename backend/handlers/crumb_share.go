package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/aws"
)

func HandleCrumbActions(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	switch strings.ToLower(req.RequestContext.HTTP.Method) {
	case "post":
		return handleShareCrumb(ctx, req)

	default:
		return handleGetCrumbs(ctx, req)

	}
}

func handleShareCrumb(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthUserId(req)
	if userId == "" {
		return models.UnauthorizedErrorResponse("You need to be logged in to do this!"), nil
	}

	var body models.CrumbBody
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.InvalidRequestErrorResponse("Invalid request body!"), nil
	}

	if body.Id == "" {
		return models.InvalidRequestErrorResponse("Crumb body must contain an id that corresponds to its media items id!"), nil
	}

	if len(body.Receivers) < 1 {
		return models.InvalidRequestErrorResponse("Crumb body must contain recipients!"), nil
	}

	if body.LocationType == "" {
		return models.InvalidRequestErrorResponse("Crumb body must contain either 'mine', 'gps', or 'friend' as location type!"), nil
	}

	helper := helpers.NewCrumbHelper(ctx)
	err := helper.SendCrumb(userId, body)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to send crumb!", err), nil
	}

	return models.SuccessfulRequestResponse("Crumb sent!", true), nil
}

func handleGetCrumbs(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthUserId(req)
	if userId == "" {
		return models.UnauthorizedErrorResponse("You need to login to do this!"), nil
	}
	senderId := strings.TrimSpace(req.QueryStringParameters["sender"])
	lastEvalKey, err := models.DecodeLastEvalKey(req.QueryStringParameters["last"])
	if err != nil {
		return models.ServerSideErrorResponse("Failed to decode last eval key!", err), nil
	}

	helper := helpers.NewCrumbHelper(ctx)
	crumbs, lastKey, err := helper.GetCrumbs(userId, senderId, &lastEvalKey, aws.Int32(30))
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get unopened crumbs, try again!", err), nil
	}

	return models.SuccessfulGetRequestResponse(crumbs, &lastKey), nil
}

func handleGetSentCrumbs(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthUserId(req)
	if userId == "" {
		return models.UnauthorizedErrorResponse("You need to login to do this!"), nil
	}
	recipientId := strings.TrimSpace(req.QueryStringParameters["recipient"])
	lastEvalKey, err := models.DecodeLastEvalKey(req.QueryStringParameters["last"])
	if err != nil {
		return models.ServerSideErrorResponse("Failed to decode last eval key!", err), nil
	}

	helper := helpers.NewCrumbHelper(ctx)
	crumbs, lastKey, err := helper.GetSentCrumbs(userId, recipientId, &lastEvalKey, aws.Int32(30))
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get sent crumbs, try again!", err), nil
	}

	return models.SuccessfulGetRequestResponse(crumbs, &lastKey), nil
}
