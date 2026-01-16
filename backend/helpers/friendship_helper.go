package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type friendshipHelper struct {
	Ctx context.Context
}

func NewFriendshipHelper(ctx context.Context) *friendshipHelper {
	return &friendshipHelper{
		Ctx: ctx,
	}
}

func (this *friendshipHelper) SendFriendReq(sender *models.User, recipientId string) error {
	friendReq := models.NewFriendRequest(recipientId, sender)
	return PutItem(newHelper(this.Ctx, nil), &friendReq)
}

func (this *friendshipHelper) CancelFriendRequest(senderId, recipientId string) error {
	friendReqKey := models.FriendRequestKey(recipientId, senderId)
	return DeleteItem(newHelper(this.Ctx, nil), &friendReqKey)
}

func (this *friendshipHelper) EndFriendship(user1id, user2id string) error {
	// deletes the 2 friendship items belonging to each user that were formally friends
	key1 := models.FriendKey(user1id, user2id)
	key2 := models.FriendKey(user2id, user1id)

	return TransactWrite(
		newHelper(this.Ctx, nil),
		UseDelete(key1, utils.GetDependencies().MainTableName),
		UseDelete(key2, utils.GetDependencies().MainTableName),
	)
}

func (this *friendshipHelper) AcceptFriendRequest(thisUser, otherUser *models.User) error {
	// delete friend req and add 2 new friendship items bidirectional one for each user
	friendReqKey := models.FriendRequestKey(thisUser.Userid, otherUser.Userid)
	friendshipItem1 := models.NewFriendship(thisUser.Userid, otherUser)
	friendshipItem2 := models.NewFriendship(otherUser.Userid, thisUser)

	return TransactWrite(
		newHelper(this.Ctx, nil),
		UseDelete(friendReqKey, utils.GetDependencies().MainTableName),
		UsePut(friendshipItem1, utils.GetDependencies().MainTableName, nil),
		UsePut(friendshipItem2, utils.GetDependencies().MainTableName, nil),
	)
}

func (this *friendshipHelper) RejectFriendRequest(senderId, recipientId string) error {
	friendReqKey := models.FriendRequestKey(recipientId, senderId)
	return DeleteItem(newHelper(this.Ctx, nil), &friendReqKey)
}

func (this *friendshipHelper) usersAreFriends(senderId string, recipientId string) (bool, error) {
	friendshipKey := models.FriendKey(senderId, recipientId)
	return ItemExists(newHelper(this.Ctx, nil), friendshipKey)
}

func (this *friendshipHelper) userHasRequestedFriendship(senderId string, recipientId string) (bool, error) {
	friendReqKey := models.FriendRequestKey(recipientId, senderId)
	return ItemExists(newHelper(this.Ctx, nil), friendReqKey)
}

func (this *friendshipHelper) GetFriendshipStatus(currentUserId string, otherUserId string) (string, error) {
	// checks if this user has sent a friend request to other user
	requested, reqErr := this.userHasRequestedFriendship(currentUserId, otherUserId)
	if reqErr != nil {
		return "", reqErr
	}

	if requested {
		return constants.FRIENDSHIP_STATUS_REQUESTED, nil
	}

	// checks if other user has sent a friend request to this user
	received, recErr := this.userHasRequestedFriendship(otherUserId, currentUserId)
	if recErr != nil {
		log.Print("error while checking if user has RECEIVED a friend request")
		return "", recErr
	}

	if received {
		return constants.FRIENDSHIP_STATUS_RECEIVED, nil
	}

	friends, fErr := this.usersAreFriends(currentUserId, otherUserId)
	if fErr != nil {
		return "", fErr
	}

	if friends {
		return constants.FRIENDSHIP_STATUS_FRIENDS, nil
	}

	return constants.FRIENDSHIP_STATUS_NOT_FRIENDS, nil
}

func (this *friendshipHelper) GetAllFriends(userId string) (*[]models.UserDisplayInfo, error) {
	condition := expression.KeyEqual(expression.Key("pk"), expression.Value(utils.AddPrefix(models.FriendItemPk, userId))).And(
		expression.KeyBeginsWith(expression.Key("sk"), models.FriendItemSk),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(condition).Build()

	if err != nil {
		log.Println("failed to build expression")
		return nil, err
	}

	return QueryItems(
		newHelper(this.Ctx, nil),
		nil,
		expr,
		func(m []map[string]types.AttributeValue) []models.UserDisplayInfo {
			return *models.FriendItemsToUserDisplayStructs(m)
		},
	)
}

func (this *friendshipHelper) GetAllFriendRequests(userId string) (*[]models.UserDisplayInfo, error) {
	condition := expression.KeyEqual(
		expression.Key("pk"),
		expression.Value(utils.AddPrefix(models.FriendRequestPkPrefix, userId)),
	).And(
		expression.KeyBeginsWith(
			expression.Key("sk"),
			models.FriendRequestSkPrefix,
		),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(condition).Build()

	if err != nil {
		return nil, err
	}

	return QueryItems(
		newHelper(this.Ctx, nil),
		nil,
		expr,
		func(m []map[string]types.AttributeValue) []models.UserDisplayInfo {
			return *models.FriendRequestItemsToUserDisplayStructs(m)
		},
	)
}

func (f *friendshipHelper) UpdateFriendDisplayInfo(currentUser *models.User) error {
	// get user info
	// get all friendship items
	// update the display info

	helper := newHelper(f.Ctx, nil)

	userFriends, err := f.GetAllFriends(currentUser.Userid)
	if err != nil {
		log.Println("Failed to get user friends!")
		return err
	}

	var updates []types.WriteRequest

	for _, friend := range *userFriends {
		// gets the friendship key where pk is current user and sk is other user
		// flips it around to overwrite
		updatedItem := models.NewFriendship(friend.Userid, currentUser)
		updates = append(updates, UsePutBatchItem(helper, updatedItem))
	}

	return BatchWriteItems(helper, updates...)
}
