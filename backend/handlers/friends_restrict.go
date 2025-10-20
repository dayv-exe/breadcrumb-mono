package handlers

import (
	"backend/models"
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
)

func HandleRestrictFriend(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// TODO
	return models.ServerSideErrorResponse("NOT IMPLEMENTED!", fmt.Errorf("Calling a non implemented function!")), nil
}
