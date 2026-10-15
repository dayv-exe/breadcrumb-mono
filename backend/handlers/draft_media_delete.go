package handlers

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
)

type DeletedMedia struct {
	StorageKeys []string `json:"storageKeys"`
}

func HandleDeleteDraftMedia(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	utils.InitHandlerDependencies(
		utils.WithBucket(),
		utils.WithDatabaseAndNoQueue(),
	)

	var reqBody DeletedMedia
	if err := json.Unmarshal([]byte(req.Body), &reqBody); err != nil {
		return models.InvalidRequestErrorResponse("Failed to unmarshal deleted media json!"), nil
	}

	userid := utils.GetAuthenticatedUserid()
	err := helpers.NewDraftMediaFlagHelper(ctx).DeleteDraftMedia(userid, reqBody.StorageKeys)

	if err != nil {
		return models.ServerSideErrorResponse("Failed to delete draft media", err), nil
	}

	return models.SuccessfulRequestResponse("Delete!", false), nil
}
