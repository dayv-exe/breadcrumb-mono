package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

type EditBody struct {
	Target  string `json:"target"`
	Payload string `json:"payload"`
}

func handleEditUser(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {

	var editBody EditBody
	if err := json.Unmarshal([]byte(req.Body), &editBody); err != nil {
		return models.InvalidRequestErrorResponse("failed to unmarshal"), nil
	}

	user, err := helpers.NewUserHelper(ctx).FindById(utils.GetAuthUserId(req))
	if err != nil {
		return models.NotFoundResponse("failed to get user"), nil
	}

	switch editBody.Target {
	case "nickname":
		err := helpers.NewUserHelper(ctx).UpdateNickname(user, editBody.Payload)
		if err != nil {
			return models.ServerSideErrorResponse("Error while trying to update nickname", err), nil
		}
		return models.SuccessfulRequestResponse("Nickname changed!", false), nil

	case "name":
		err := helpers.NewUserHelper(ctx).UpdateName(user, editBody.Payload)
		if err != nil {
			return models.ServerSideErrorResponse("Error while trying to update name", err), nil
		}
		return models.SuccessfulRequestResponse("Name changed!", false), nil

	case "bio":
		err := helpers.NewUserHelper(ctx).UpdateBio(user.Userid, editBody.Payload)
		if err != nil {
			return models.ServerSideErrorResponse("Error while trying to update bio", err), nil
		}

		return models.SuccessfulRequestResponse("", false), nil

	default:
		return models.InvalidRequestErrorResponse("invalid update attribute name"), nil
	}
}

func handleProfilePicture(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	method := req.RequestContext.HTTP.Method
	switch strings.ToLower(method) {
	case "put":
		return handleUpdateProfilePicture(ctx, req)
	case "get":
		return handleGetProfilePictureUrl(ctx, req)
	default:
		return models.InvalidRequestErrorResponse("Invalid profile picture method!"), nil
	}
}

func handleUpdateProfilePicture(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := utils.GetAuthUserId(req)
	imageKey := strings.ToLower(strings.TrimSpace(req.QueryStringParameters["imageKey"]))
	thumbnailKey := strings.ToLower(strings.TrimSpace(req.QueryStringParameters["thumbnailKey"]))

	if imageKey != "" {
		if thumbnailKey == "" {
			return models.InvalidRequestErrorResponse("No thumbnail key provided!"), nil
		}
		parts := strings.Split(imageKey, "/")
		folderName := parts[len(parts)-2]
		fileName := parts[len(parts)-1]

		if folderName != userId || !strings.HasPrefix(fileName, userId) || !strings.HasPrefix(thumbnailKey, imageKey) {
			return models.ForbiddenErrorResponse("Invalid profile picture keys"), nil
		}

	} else {
		thumbnailKey = ""
	}

	err := helpers.NewUserHelper(ctx).UpdateProfilePic(userId, models.CrumbMedia{
		Index:        0,
		MediaKey:     imageKey,
		ThumbnailKey: thumbnailKey,
	})
	if err != nil {
		return models.ServerSideErrorResponse("Failed to update profile picture, try again", err), nil
	}

	return models.SuccessfulRequestResponse("Updated successfully!", false), nil
}
