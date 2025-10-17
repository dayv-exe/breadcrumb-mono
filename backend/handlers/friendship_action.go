package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/events"
)

type handleRequestDependencies struct {
	FriendshipStatus string
	ExpectedStatus   string
}

func handleRequest(ctx context.Context, deps handleRequestDependencies, friendshipActionFunc func() error) (events.APIGatewayProxyResponse, error) {
	if deps.FriendshipStatus != deps.ExpectedStatus {
		return models.InvalidRequestErrorResponse(fmt.Sprintf("Current friendship status is %v, but expected friendship status to be %v to carry out this action", deps.FriendshipStatus, deps.ExpectedStatus)), nil
	}
	err := friendshipActionFunc()
	if err != nil {
		return models.ServerSideErrorResponse("Something went wrong, try again.", err, "Error in friend req handler"), nil
	}

	return models.SuccessfulRequestResponse("Done", false), nil
}

func getFriends(ctx context.Context, req *events.APIGatewayProxyRequest, otherUserid string) (events.APIGatewayProxyResponse, error) {
	friendshipHelper := helpers.NewFriendshipHelper(ctx)

	users, err := friendshipHelper.GetAllFriends(otherUserid)
	if err != nil {
		return models.ServerSideErrorResponse("", err, "error trying to get all friends."), nil
	}

	currentUser := utils.GetAuthUserId(req)
	if otherUserid == currentUser {
		// if user is requesting to see their own list of friends
		return models.SuccessfulGetRequestResponse(users), nil
	}

	// user is requesting to see another users list of friends
	var friends []models.User
	for _, user := range *users {
		status, _ := friendshipHelper.GetFriendshipStatus(currentUser, user.Userid)
		friends = append(friends, models.User{
			UserDisplayInfo: user,
			UserAccountInfo: models.UserAccountInfo{
				FriendshipStatus: status,
			},
		})
	}

	return models.SuccessfulGetRequestResponse(friends), nil
}

func getRequests(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	friendshipHelper := helpers.NewFriendshipHelper(ctx)
	userid := utils.GetAuthUserId(req)
	requests, err := friendshipHelper.GetAllFriendRequests(userid)
	if err != nil {
		return models.ServerSideErrorResponse("Something went wrong try again", err, ""), nil
	}

	return models.SuccessfulGetRequestResponse(requests), nil
}

func HandleFriendshipAction(ctx context.Context, req *events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	action, actionExists := req.PathParameters["action"]
	if !actionExists {
		return models.InvalidRequestErrorResponse(""), nil
	}

	otherUserId, exists := req.PathParameters["userid"] // PAYLOAD param in url
	if !exists && (action != constants.FRIENDSHIP_ACTION_GET_FRIENDS && action != constants.FRIENDSHIP_ACTION_GET_REQUESTED) {
		return models.InvalidRequestErrorResponse(""), nil
	}

	thisUserId := utils.GetAuthUserId(req)
	if thisUserId == "" {
		return models.UnauthorizedErrorResponse(""), nil
	}

	// check if they are friends
	friendshipHelper := helpers.NewFriendshipHelper(ctx)

	status, statusErr := friendshipHelper.GetFriendshipStatus(thisUserId, otherUserId)
	if statusErr != nil {
		return models.ServerSideErrorResponse("Something went wrong, try again.", statusErr, "error while trying to get friendship status"), nil
	}

	findUserHelper := helpers.NewUserHelper(ctx)

	thisUser, tuErr := findUserHelper.FindById(thisUserId)
	if tuErr != nil {
		return models.ServerSideErrorResponse("Something went wrong.", tuErr, "error while trying to fetch this user details"), nil
	}

	otherUser, ouErr := findUserHelper.FindById(otherUserId)
	if ouErr != nil {
		return models.ServerSideErrorResponse("Something went wrong", ouErr, "error while trying to fetch other user details"), nil
	}

	deps := handleRequestDependencies{
		FriendshipStatus: status,
	}

	switch action {
	// send friend request if not friends
	case constants.FRIENDSHIP_ACTION_REQUEST:
		deps.ExpectedStatus = constants.FRIENDSHIP_STATUS_NOT_FRIENDS
		return handleRequest(ctx, deps, func() error {
			return friendshipHelper.SendFriendReq(thisUser, otherUserId)
		})

		// cancel friend request if sent
	case constants.FRIENDSHIP_ACTION_CANCEL_REQUEST:
		deps.ExpectedStatus = constants.FRIENDSHIP_STATUS_REQUESTED
		return handleRequest(ctx, deps, func() error {
			return friendshipHelper.CancelFriendRequest(thisUser.Userid, otherUserId)
		})

		// end friendship if friends
	case constants.FRIENDSHIP_ACTION_END_FRIENDSHIP:
		deps.ExpectedStatus = constants.FRIENDSHIP_STATUS_FRIENDS
		return handleRequest(ctx, deps, func() error {
			return friendshipHelper.EndFriendship(thisUser.Userid, otherUserId)
		})

	// accept friend request
	case constants.FRIENDSHIP_ACTION_ACCEPT:
		deps.ExpectedStatus = constants.FRIENDSHIP_STATUS_RECEIVED
		return handleRequest(ctx, deps, func() error {
			return friendshipHelper.AcceptFriendRequest(thisUser, otherUser)
		})

		// reject friend request
	case constants.FRIENDSHIP_ACTION_REJECT:
		deps.ExpectedStatus = constants.FRIENDSHIP_STATUS_RECEIVED
		return handleRequest(ctx, deps, func() error {
			return friendshipHelper.RejectFriendRequest(otherUserId, thisUserId)
		})

		// to list all friends
	case constants.FRIENDSHIP_ACTION_GET_FRIENDS:
		return getFriends(ctx, req, otherUserId)

		// to list all friend requests
	case constants.FRIENDSHIP_ACTION_GET_REQUESTED:
		return getRequests(ctx, req)

	default:
		return models.ServerSideErrorResponse("Something went wrong while determining friendship action, try again.", fmt.Errorf("Status returned does not match any expected outcome. status returned: %v", status), "Status returned does not match any expected outcome"), nil
	}
}
