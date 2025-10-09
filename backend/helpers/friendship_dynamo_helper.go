package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type FriendshipDynamoHelper struct {
	Dependencies *utils.HandlerDependencies
	Ctx          context.Context
}

var (
	helper utils.Helper
)

func NewFriendshipHelper(deps *utils.HandlerDependencies, ctx context.Context) *FriendshipDynamoHelper {
	helper = utils.Helper{
		TableName: deps.TableName,
		DbClient:  deps.DbClient,
		Ctx:       ctx,
	}

	return &FriendshipDynamoHelper{
		Dependencies: deps,
		Ctx:          ctx,
	}
}

func (this *FriendshipDynamoHelper) SendFriendReq(sender *models.User, recipientId string) error {
	friendReq := models.NewFriendRequest(recipientId, sender)
	return utils.PutItem(&helper, &(friendReq))
}

func (this *FriendshipDynamoHelper) CancelFriendRequest(senderId, recipientId string) error {
	friendReqKey := models.FriendRequestKey(recipientId, senderId)
	return utils.DeleteItem(&helper, &friendReqKey)
}

func (this *FriendshipDynamoHelper) EndFriendship(user1id, user2id string) error {
	// deletes the 2 friendship items belonging to each user that were formally friends
	key1 := models.FriendKey(user1id, user2id)
	key2 := models.FriendKey(user2id, user1id)

	return utils.TransactWrite(
		&helper,
		utils.UseDelete(&key1, this.Dependencies.TableName),
		utils.UseDelete(&key2, this.Dependencies.TableName),
	)
}

func (this *FriendshipDynamoHelper) AcceptFriendRequest(thisUser, otherUser *models.User) error {
	// delete friend req and add 2 new friendship items bidirectional one for each user
	friendReqKey := models.FriendRequestKey(thisUser.Userid, otherUser.Userid)
	friendshipItem1 := models.NewFriendship(thisUser.Userid, otherUser)
	friendshipItem2 := models.NewFriendship(otherUser.Userid, thisUser)

	return utils.TransactWrite(
		&helper,
		utils.UseDelete(&friendReqKey, this.Dependencies.TableName),
		utils.UsePut(&friendshipItem1, this.Dependencies.TableName),
		utils.UsePut(&friendshipItem2, this.Dependencies.TableName),
	)
}

func (this *FriendshipDynamoHelper) RejectFriendRequest(senderId, recipientId string) error {
	friendReqKey := models.FriendRequestKey(recipientId, senderId)
	return utils.DeleteItem(&helper, &friendReqKey)
}

func (this *FriendshipDynamoHelper) usersAreFriends(senderId string, recipientId string) (bool, error) {
	friendshipKey := models.FriendKey(senderId, recipientId)
	return utils.ItemExists(&helper, &friendshipKey)
}

func (this *FriendshipDynamoHelper) userHasRequestedFriendship(senderId string, recipientId string) (bool, error) {
	friendReqKey := models.FriendRequestKey(recipientId, senderId)
	return utils.ItemExists(&helper, &friendReqKey)
}

func (this *FriendshipDynamoHelper) GetFriendshipStatus(senderId string, recipientId string) (string, error) {
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

func (this *FriendshipDynamoHelper) GetAllFriends(userId string) (*[]models.UserDisplayInfo, error) {
	expression := "pk = :pk AND begins_with(sk, :skPrefix)"
	expressionVals := map[string]types.AttributeValue{
		":pk":       &types.AttributeValueMemberS{Value: utils.AddPrefix(models.FriendItemPk, userId)},
		":skPrefix": &types.AttributeValueMemberS{Value: models.FriendItemSk},
	}
	return utils.QueryItems(
		&helper,
		expression,
		&expressionVals,
		func(m []map[string]types.AttributeValue) []models.UserDisplayInfo {
			return *models.FriendItemsToUserDisplayStructs(&m)
		},
	)
}

func (this *FriendshipDynamoHelper) GetAllFriendRequests(userId string) (*[]models.UserDisplayInfo, error) {
	expression := "pk = :pk AND begins_with(sk, :skPrefix)"
	expressionVals := map[string]types.AttributeValue{
		":pk":       &types.AttributeValueMemberS{Value: utils.AddPrefix(models.FriendRequestPkPrefix, userId)},
		":skPrefix": &types.AttributeValueMemberS{Value: models.FriendRequestSkPrefix},
	}

	return utils.QueryItems(
		&helper,
		expression,
		&expressionVals,
		func(m []map[string]types.AttributeValue) []models.UserDisplayInfo {
			return *models.FriendItemsToUserDisplayStructs(&m)
		},
	)
}
