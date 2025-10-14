package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type friendshipDynamoHelper struct {
	Ctx context.Context
}

func NewFriendshipHelper(ctx context.Context) *friendshipDynamoHelper {
	return &friendshipDynamoHelper{
		Ctx: ctx,
	}
}

func (this *friendshipDynamoHelper) SendFriendReq(sender *models.User, recipientId string) error {
	friendReq := models.NewFriendRequest(recipientId, sender)
	return PutItem(NewHelper(this.Ctx, nil), &friendReq)
}

func (this *friendshipDynamoHelper) UpdateFriendRequest() {
	
}

func (this *friendshipDynamoHelper) UpdateFriendship() {

}

func (this *friendshipDynamoHelper) CancelFriendRequest(senderId, recipientId string) error {
	friendReqKey := models.FriendRequestKey(recipientId, senderId)
	return DeleteItem(NewHelper(this.Ctx, nil), &friendReqKey)
}

func (this *friendshipDynamoHelper) EndFriendship(user1id, user2id string) error {
	// deletes the 2 friendship items belonging to each user that were formally friends
	key1 := models.FriendKey(user1id, user2id)
	key2 := models.FriendKey(user2id, user1id)

	return TransactWrite(
		NewHelper(this.Ctx, nil),
		UseDelete(key1, utils.GetDependencies().MainTableName),
		UseDelete(key2, utils.GetDependencies().MainTableName),
	)
}

func (this *friendshipDynamoHelper) AcceptFriendRequest(thisUser, otherUser *models.User) error {
	// delete friend req and add 2 new friendship items bidirectional one for each user
	friendReqKey := models.FriendRequestKey(thisUser.Userid, otherUser.Userid)
	friendshipItem1 := models.NewFriendship(thisUser.Userid, otherUser)
	friendshipItem2 := models.NewFriendship(otherUser.Userid, thisUser)

	return TransactWrite(
		NewHelper(this.Ctx, nil),
		UseDelete(friendReqKey, utils.GetDependencies().MainTableName),
		UsePut(friendshipItem1, utils.GetDependencies().MainTableName, nil),
		UsePut(friendshipItem2, utils.GetDependencies().MainTableName, nil),
	)
}

func (this *friendshipDynamoHelper) RejectFriendRequest(senderId, recipientId string) error {
	friendReqKey := models.FriendRequestKey(recipientId, senderId)
	return DeleteItem(NewHelper(this.Ctx, nil), &friendReqKey)
}

func (this *friendshipDynamoHelper) usersAreFriends(senderId string, recipientId string) (bool, error) {
	friendshipKey := models.FriendKey(senderId, recipientId)
	return ItemExists(NewHelper(this.Ctx, nil), friendshipKey)
}

func (this *friendshipDynamoHelper) userHasRequestedFriendship(senderId string, recipientId string) (bool, error) {
	friendReqKey := models.FriendRequestKey(recipientId, senderId)
	return ItemExists(NewHelper(this.Ctx, nil), friendReqKey)
}

func (this *friendshipDynamoHelper) GetFriendshipStatus(senderId string, recipientId string) (string, error) {
	// checks if this user has sent a friend request to other user
	requested, reqErr := this.userHasRequestedFriendship(senderId, recipientId)
	if reqErr != nil {
		return "", reqErr
	}

	if requested {
		return constants.FRIENDSHIP_STATUS_REQUESTED, nil
	}

	// checks if other user has sent a friend request to this user
	received, recErr := this.userHasRequestedFriendship(recipientId, senderId)
	if recErr != nil {
		log.Print("error while checking if user has RECEIVED a friend request")
		return "", recErr
	}

	if received {
		return constants.FRIENDSHIP_STATUS_RECEIVED, nil
	}

	friends, fErr := this.usersAreFriends(senderId, recipientId)
	if fErr != nil {
		return "", fErr
	}

	if friends {
		return constants.FRIENDSHIP_STATUS_FRIENDS, nil
	}

	return constants.FRIENDSHIP_STATUS_NOT_FRIENDS, nil
}

func (this *friendshipDynamoHelper) GetAllFriends(userId string) (*[]models.UserDisplayInfo, error) {
	expression := "pk = :pk AND begins_with(sk, :skPrefix)"
	expressionVals := map[string]types.AttributeValue{
		":pk":       &types.AttributeValueMemberS{Value: utils.AddPrefix(models.FriendItemPk, userId)},
		":skPrefix": &types.AttributeValueMemberS{Value: models.FriendItemSk},
	}
	return QueryItems(
		NewHelper(this.Ctx, nil),
		nil,
		expression,
		expressionVals,
		func(m []map[string]types.AttributeValue) []models.UserDisplayInfo {
			return *models.FriendItemsToUserDisplayStructs(m)
		},
	)
}

func (this *friendshipDynamoHelper) GetAllFriendRequests(userId string) (*[]models.UserDisplayInfo, error) {
	expression := "pk = :pk AND begins_with(sk, :skPrefix)"
	expressionVals := map[string]types.AttributeValue{
		":pk":       &types.AttributeValueMemberS{Value: utils.AddPrefix(models.FriendRequestPkPrefix, userId)},
		":skPrefix": &types.AttributeValueMemberS{Value: models.FriendRequestSkPrefix},
	}

	return QueryItems(
		NewHelper(this.Ctx, nil),
		nil,
		expression,
		expressionVals,
		func(m []map[string]types.AttributeValue) []models.UserDisplayInfo {
			return *models.FriendRequestItemsToUserDisplayStructs(m)
		},
	)
}
