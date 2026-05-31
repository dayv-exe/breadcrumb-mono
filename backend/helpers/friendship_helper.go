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

func (this *friendshipHelper) GetAllFriends(userId string, lastEvalKey *map[string]types.AttributeValue, limit *int32) (*listResponse[models.UserDisplayInfo], error) {
	condition := expression.KeyEqual(expression.Key("pk"), expression.Value(utils.AddPrefix(models.FriendItemPk, userId))).And(
		expression.KeyBeginsWith(expression.Key("sk"), models.FriendItemSk),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(condition).Build()

	if err != nil {
		log.Println("failed to build expression")
		return nil, err
	}

	result, err := QueryItems(
		newHelper(this.Ctx, nil),
		lastEvalKey,
		nil,
		expr,
		limit,
		func(m []map[string]types.AttributeValue) []models.UserDisplayInfo {
			return *models.FriendItemsToUserDisplayStructs(m)
		},
	)

	return &listResponse[models.UserDisplayInfo]{
		Items:       result.Items,
		LastEvalKey: result.LastEvaluatedKey,
	}, nil
}

func (this *friendshipHelper) GetAllFriendRequests(userId string, lastEvaluatedKey *map[string]types.AttributeValue, limit *int32) (*listResponse[models.UserDisplayInfo], error) {
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

	result, err := QueryItems(
		newHelper(this.Ctx, nil),
		lastEvaluatedKey,
		nil,
		expr,
		limit,
		func(m []map[string]types.AttributeValue) []models.UserDisplayInfo {
			return *models.FriendRequestItemsToUserDisplayStructs(m)
		},
	)

	return &listResponse[models.UserDisplayInfo]{
		Items:       result.Items,
		LastEvalKey: result.LastEvaluatedKey,
	}, nil
}

func (f *friendshipHelper) GetAllFriendsCrumbMarkerDetails(userid string) ([]models.CrumbMarkerDetails, error) {
	keys := make([]models.CrumbMarkerDetails, 0)
	// get all your friends sk
	condition := expression.KeyEqual(expression.Key("pk"), expression.Value(utils.AddPrefix(models.FriendItemPk, userid))).And(
		expression.KeyBeginsWith(expression.Key("sk"), models.FriendItemSk),
	)

	proj := expression.NamesList(
		expression.Name("sk"),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(condition).WithProjection(proj).Build()
	if err != nil {
		return keys, err
	}

	helper := newHelper(f.Ctx, nil)

	// get all friend ids
	friends := make([]map[string]types.AttributeValue, 0)
	err = QueryAllItemsAndProcess(
		helper,
		nil,
		expr,
		func(friendRows []map[string]types.AttributeValue) {
			for _, friendItem := range friendRows {
				friend := models.DbItemToFriendStruct(friendItem)
				friends = append(friends, *models.UserKey(friend.ThisUserId))
				log.Printf("FRIEND THIS USER ID: %#v", friend.ThisUserId)
				log.Printf("FRIEND OTHER USER ID: %#v", friend.OtherUserID)
			}
		},
	)
	if err != nil {
		return keys, err
	}

	// get all friend profilePics and sign
	err = BatchGetAndProcessItems(
		helper,
		func(users []map[string]types.AttributeValue) {
			for _, u := range users {
				user := models.ConvertToUser(u)
				thumbnailKey, _, err := NewCloudfrontHelper(f.Ctx).GetSignedUrl(user.ProfilePicture.ThumbnailKey, constants.PROFILE_PICTURE_URL_TTL)
				if err != nil {
					return
				}

				pictureKey, _, err := NewCloudfrontHelper(f.Ctx).GetSignedUrl(user.ProfilePicture.MediaKey, constants.PROFILE_PICTURE_URL_TTL)
				if err != nil {
					return
				}

				keys = append(keys, models.CrumbMarkerDetails{
					UserId:                  user.Userid,
					ProfilePicture:          pictureKey,
					ProfilePictureThumbnail: thumbnailKey,
					Nickname:                user.Nickname,
				})
			}
		},
		friends...,
	)

	if err != nil {
		return keys, err
	}

	return keys, nil
}

type getNewFriendItem func(models.Friend) types.WriteRequest
type getListOfFriends func() (*listResponse[models.UserDisplayInfo], error)

// TODO: FIX LATER
func (f *friendshipHelper) updateFriendshipDisplayInfo(currentUser *models.User) error {
	helper := newHelper(f.Ctx, nil)
	var lastEvalKey map[string]types.AttributeValue

	for {
		result, err := f.GetAllFriends(currentUser.Userid, &lastEvalKey, nil)
		if err != nil {
			log.Println("Failed to get user friends!")
			return err
		}

		var updates []types.WriteRequest

		for _, friend := range result.Items {
			// gets the friendship key where pk is current user and sk is other user
			// flips it around to overwrite
			updatedItem := models.NewFriendship(friend.Userid, currentUser)
			updates = append(updates, UsePutBatchItem(helper, updatedItem))
		}

		BatchWriteItems(helper, updates...)

		if result.LastEvalKey == nil {
			break
		}

		lastEvalKey = result.LastEvalKey
	}

	return nil
}

func (f *friendshipHelper) UpdateFriendDisplayInfo(currentUser *models.User) error {
	// get user info
	// get all friendship items
	// update the display info

	helper := newHelper(f.Ctx, nil)
	var lastEvalKey map[string]types.AttributeValue

	for {
		result, err := f.GetAllFriends(currentUser.Userid, &lastEvalKey, nil)
		if err != nil {
			log.Println("Failed to get user friends!")
			return err
		}

		var updates []types.WriteRequest

		for _, friend := range result.Items {
			// gets the friendship key where pk is current user and sk is other user
			// flips it around to overwrite
			updatedItem := models.NewFriendship(friend.Userid, currentUser)
			updates = append(updates, UsePutBatchItem(helper, updatedItem))
		}

		BatchWriteItems(helper, updates...)

		if result.LastEvalKey == nil {
			break
		}

		lastEvalKey = result.LastEvalKey
	}

	return nil
}
