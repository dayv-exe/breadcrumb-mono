package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

type EditBody struct {
	Target  string `json:"target"`
	Payload string `json:"payload"`
}

func HandleEditUserDetails(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {

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
