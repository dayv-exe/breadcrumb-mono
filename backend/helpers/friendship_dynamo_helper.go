package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type FriendshipDynamoHelper struct {
	Dependencies *utils.HandlerDependencies
	Ctx          context.Context
}

func (this *FriendshipDynamoHelper) SendFriendReq(sender *models.User, recipientId string) error {
	item := utils.ToDatabaseFormat(models.NewFriendRequest(recipientId, sender))

	input := &dynamodb.PutItemInput{
		Item:      *item,
		TableName: aws.String(this.Dependencies.TableName),
	}

	_, putErr := this.Dependencies.DbClient.PutItem(this.Ctx, input)

	if putErr != nil {
		log.Print("An error occurred while trying to put friendship item in the db")
		return putErr
	}

	return nil
}

func (this *FriendshipDynamoHelper) CancelFriendRequest(senderId, recipientId string) error {
	input := &dynamodb.DeleteItemInput{
		Key:       models.FriendRequestKey(recipientId, senderId),
		TableName: aws.String(this.Dependencies.TableName),
	}

	_, err := this.Dependencies.DbClient.DeleteItem(this.Ctx, input)
	if err != nil {
		log.Print("error while trying to delete friend request item")
		return err
	}

	return nil
}

func (this *FriendshipDynamoHelper) EndFriendship(user1id, user2id string) error {
	input := &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				Delete: &types.Delete{
					Key:       models.FriendKey(user1id, user2id),
					TableName: aws.String(this.Dependencies.TableName),
				},
			},
			{
				Delete: &types.Delete{
					Key:       models.FriendKey(user2id, user1id),
					TableName: aws.String(this.Dependencies.TableName),
				},
			},
		},
	}

	_, err := this.Dependencies.DbClient.TransactWriteItems(this.Ctx, input)
	if err != nil {
		log.Print("error while trying to transact write (delete) user friendships")
		// Check for transaction cancellation reasons
		utils.PrintTransactWriteCancellationReason(err)
		return err
	}

	return nil
}

func (this *FriendshipDynamoHelper) AcceptFriendRequest(thisUser, otherUser *models.User) error {
	// 2 items for easier lookups
	item1 := utils.ToDatabaseFormat(models.NewFriendship(thisUser.Userid, otherUser))

	item2 := utils.ToDatabaseFormat(models.NewFriendship(otherUser.Userid, thisUser))

	input := &dynamodb.TransactWriteItemsInput{
		TransactItems: []types.TransactWriteItem{
			{
				// deletes friend request
				Delete: &types.Delete{
					Key:       models.FriendRequestKey(thisUser.Userid, otherUser.Userid),
					TableName: aws.String(this.Dependencies.TableName),
				},
			},

			// makes them friends
			{
				Put: &types.Put{
					Item:      *item1,
					TableName: aws.String(this.Dependencies.TableName),
				},
			},
			{
				Put: &types.Put{
					Item:      *item2,
					TableName: aws.String(this.Dependencies.TableName),
				},
			},
		},
	}

	_, err := this.Dependencies.DbClient.TransactWriteItems(this.Ctx, input)

	if err != nil {
		log.Print("an error occurred while transact writing new friendship to db")
		// Check for transaction cancellation reasons
		utils.PrintTransactWriteCancellationReason(err)
		return err
	}

	return nil
}

func (this *FriendshipDynamoHelper) RejectFriendRequest(senderId, recipientId string) error {
	input := &dynamodb.DeleteItemInput{
		Key:       models.FriendRequestKey(recipientId, senderId),
		TableName: aws.String(this.Dependencies.TableName),
	}

	_, err := this.Dependencies.DbClient.DeleteItem(this.Ctx, input)

	if err != nil {
		log.Print("an error occurred while trying to delete friend request")
		return err
	}

	return nil
}

func (this *FriendshipDynamoHelper) usersAreFriends(senderId string, recipientId string) (bool, error) {
	input := &dynamodb.GetItemInput{
		Key:       models.FriendKey(senderId, recipientId),
		TableName: aws.String(this.Dependencies.TableName),
	}

	item, err := this.Dependencies.DbClient.GetItem(this.Ctx, input)

	if err != nil {
		log.Print("an error occurred while trying to get friendship item from db")
		return false, err
	}

	return len(item.Item) > 0, nil
}

func (this *FriendshipDynamoHelper) userHasRequestedFriendship(senderId string, recipientId string) (bool, error) {
	input := &dynamodb.GetItemInput{
		Key:       models.FriendRequestKey(recipientId, senderId),
		TableName: aws.String(this.Dependencies.TableName),
	}

	item, err := this.Dependencies.DbClient.GetItem(this.Ctx, input)

	if err != nil {
		log.Println("an error occurred while trying to get friend request item from the database")
		return false, err
	}
	return len(item.Item) > 0, nil
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
	input := &dynamodb.QueryInput{
		TableName:              aws.String(this.Dependencies.TableName),
		KeyConditionExpression: aws.String("pk = :pk AND begins_with(sk, :skPrefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk":       &types.AttributeValueMemberS{Value: utils.AddPrefix(models.FriendItemPk, userId)},
			":skPrefix": &types.AttributeValueMemberS{Value: models.FriendItemSk},
		},
	}

	items, err := this.Dependencies.DbClient.Query(this.Ctx, input)
	if err != nil {
		log.Print("an error occurred while trying to query users friends")
		return nil, err
	}

	friends := models.FriendItemsToUserDisplayStructs(&items.Items)

	return friends, nil
}

func (this *FriendshipDynamoHelper) GetAllFriendRequests(userId string) (*[]models.UserDisplayInfo, error) {
	input := &dynamodb.QueryInput{
		TableName:              aws.String(this.Dependencies.TableName),
		KeyConditionExpression: aws.String("pk = :pk AND begins_with(sk, :skPrefix)"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":pk":       &types.AttributeValueMemberS{Value: utils.AddPrefix(models.FriendRequestPkPrefix, userId)},
			":skPrefix": &types.AttributeValueMemberS{Value: models.FriendRequestSkPrefix},
		},
	}

	items, err := this.Dependencies.DbClient.Query(this.Ctx, input)
	if err != nil {
		log.Print("an error occurred while trying to query users friend requests")
		return nil, err
	}

	requestedUsers := models.FriendRequestItemsToUserDisplayStructs(&items.Items)

	return requestedUsers, nil
}
