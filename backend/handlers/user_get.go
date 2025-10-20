package handlers

// RETURNS PRIMARY USER DETAILS, OR IF USER REQUESTS OWN DETAILS, RETURN ALL THEIR DETAILS IN COGNITO AND DYNAMODB

import (
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
)

// if a user request their details, this function will return all their info from cognito and dynamodb
// if a user request details of another user, it will only return profile picture url, nickname, username, and maybe mutual friends

type completeUserDetails struct {
	// all the information on a user
	models.User
	helpers.CognitoManagedInfo
}

func fHandleGetUser(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	userHelper := helpers.NewUserHelper(ctx)

	// get all info on a user from dynamodb
	user, dbErr := 

	// error
	if dbErr != nil {
		return models.ServerSideErrorResponse("Error while trying to find user by nickname", dbErr), nil
	}

	// no user found
	if user == nil {
		return models.NotFoundResponse("User not found"), nil
	}

	if utils.IsAuthenticatedUser(req, user.Userid) {
		// if the logged in user is requesting their own information

		userCognitoInfo, cogErr := helpers.NewCognitoHelper(ctx).GetManagedInfo(user.Userid)

		if cogErr != nil {
			return models.ServerSideErrorResponse("while trying to get your cognito info", fmt.Errorf("Get cognito info error: %w", cogErr)), nil
		}

		if userCognitoInfo == nil {
			return models.NotFoundResponse("User details not found."), nil
		}

		return models.SuccessfulGetRequestResponse(completeUserDetails{
			// return all the users info which is everything in dynamo and somethings in cognito
			*user,
			*userCognitoInfo,
		}), nil
	}

	// only return nickname, name, profile picture if one user requests another users information
	friendshipStatus, fsErr := helpers.NewFriendshipHelper(ctx).GetFriendshipStatus(utils.GetAuthUserId(req), user.Userid)

	if fsErr != nil {
		return models.ServerSideErrorResponse("Something went wrong while trying to get friendship status", fsErr), nil
	}

	type response struct {
		models.UserDisplayInfo
		models.UserAccountInfo
	}

	user.UserAccountInfo.FriendshipStatus = friendshipStatus
	res := response{
		user.UserDisplayInfo,
		user.UserAccountInfo,
	}

	return models.SuccessfulGetRequestResponse(res), nil
}

func HandleGetUser(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	userid := req.PathParameters["id"]
	if userid == "" {
		userid = utils.GetAuthUserId(req)
	}

	userHelper := helpers.NewUserHelper(ctx)
	
}
