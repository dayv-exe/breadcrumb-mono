package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
)

// if a user request their details, this function will return all their info from cognito and dynamodb
// if a user request details of another user, it will only return profile picture url, nickname, username, and maybe mutual friends

type completeUserDetails struct {
	// all the information on a user
	models.User
	helpers.CognitoManagedInfo
}

func findUser(ctx context.Context, userid string) (*models.User, error) {
	userHelper := helpers.NewUserHelper(ctx)

	// search by id first
	userById, userByIdErr := userHelper.FindById(userid)
	if userByIdErr != nil {
		return nil, userByIdErr
	}
	if userById == nil {
		// search by nickname if id not found
		userByNickname, userByNicknameErr := userHelper.FindByNickname(userid)
		if userByNicknameErr != nil {
			return nil, userByNicknameErr
		}
		if userByNickname == nil {
			return nil, nil
		}

		return userByNickname, nil
	}

	return userById, nil
}

func handleGetUser(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userid := req.PathParameters["id"]
	if userid == "" {
		userid = utils.GetAuthenticatedUserid()
	}

	user, userErr := findUser(ctx, userid)
	if userErr != nil {
		return models.ServerSideErrorResponse("Failed to get user!", userErr), nil
	}

	if user == nil {
		return models.NotFoundResponse("User not found!"), nil
	}

	if user.Userid == utils.GetAuthenticatedUserid() {
		// if current user is requesting their own details, return full details including cognito
		userCognitoInfo, cogitoInfoErr := helpers.NewCognitoHelper(ctx).GetManagedInfo(user.Userid)
		if cogitoInfoErr != nil {
			return models.ServerSideErrorResponse("Failed to get users cognito details!", cogitoInfoErr), nil
		}
		type res struct {
			models.User
			helpers.CognitoManagedInfo
		}

		user.AllowNicknameChange = utils.NameChangeAllowed(user.LastNicknameChange)
		user.AllowNameChange = utils.NameChangeAllowed(user.LastNameChange)
		user.AllowEmailChange = utils.NameChangeAllowed(user.LastEmailChange)
		return models.SuccessfulGetRequestResponse(
			res{
				*user,
				*userCognitoInfo,
			},
			nil), nil
	}

	// if user is requesting details of another user, return only display info and friendship status
	friendshipStatus, friendshipStatusErr := helpers.NewFriendshipHelper(ctx).GetFriendshipStatus(utils.GetAuthenticatedUserid(), user.Userid)
	if friendshipStatusErr != nil {
		return models.ServerSideErrorResponse("Failed to determine users friendship status.", friendshipStatusErr), nil
	}

	user.FriendshipStatus = friendshipStatus
	return models.SuccessfulGetRequestResponse(models.User{
		UserDisplayInfo: user.UserDisplayInfo,
		UserAccountInfo: user.UserAccountInfo,
	}, nil), nil
}

func handleGetPlacesNearbyUser(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	latStr := req.QueryStringParameters["lat"]
	lonStr := req.QueryStringParameters["lon"]
	radiusStr := req.QueryStringParameters["radius"]

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		return models.InvalidRequestErrorResponse("Invalid latitude!"), nil
	}

	lon, err := strconv.ParseFloat(lonStr, 64)
	if err != nil {
		return models.InvalidRequestErrorResponse("Invalid longitude!"), nil
	}

	radius, err := strconv.ParseFloat(radiusStr, 64)
	if err != nil {
		return models.InvalidRequestErrorResponse("Invalid radius!"), nil
	}

	places, err := helpers.NewMapboxHelper(ctx).GetNearbyPlaceIds(lat, lon, radius, constants.LOCATION_TYPE_MINE, "")
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get places nearby user!", err), nil
	}

	return models.SuccessfulGetRequestResponse(places.PlaceIds, nil), nil
}
