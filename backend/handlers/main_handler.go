package handlers

import (
	"backend/models"
	"backend/utils"
	"context"
	"fmt"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleHandlers(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	resource := strings.ToLower(utils.GetResourceName(req, 0))

	switch resource {
	case "friends":
		return HandleFriendsActions(ctx, req)
	case "friendships":
		return HandleFriendshipActions(ctx, req)
	case "friend-requests":
		return HandleFriendRequestActions(ctx, req)
	case "users":
		return HandleUserActions(ctx, req)
	case "search":
		return HandleSearchActions(ctx, req)
	case "crumbs":
		return HandleCrumbActions(ctx, req)
	case "profile-picture":
		return handleProfilePicture(ctx, req)
	case "signup":
		method := strings.ToLower(req.RequestContext.HTTP.Method)
		switch method {
		case "delete":
			return handleAbortSignup(ctx, req)
		default:
			return models.ServerSideErrorResponse("Invalid signup resource path!", fmt.Errorf("Invalid signup path. Request context: %v \n raw path: %v", req.RequestContext.HTTP.Path, req.RawPath)), nil
		}
	case "media-access":
		return HandleMediaAccess(ctx, req)
	default:
		return models.ServerSideErrorResponse("Invalid resource path!", fmt.Errorf("Invalid path. Request context: %v \n raw path: %v", req.RequestContext.HTTP.Path, req.RawPath)), nil
	}
}
