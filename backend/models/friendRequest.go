package models

import (
	"backend/utils"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type friendRequest struct {
	RecipientId string `dynamodbav:"pk"`
	SenderId    string `dynamodbav:"sk" json:"userId"`
	UserDisplayInfoNoId
	Date string `dynamodbav:"date" json:"date"`
}

const (
	FriendRequestPkPrefix = "USER#"
	FriendRequestSkPrefix = "FRIEND_REQUEST_FROM#"
)

func NewFriendRequest(recipientUserId string, sender *User) *friendRequest {
	fr := friendRequest{
		RecipientId: recipientUserId,
		SenderId:    sender.Userid,
		Date:        utils.GetTimeNow(),
		UserDisplayInfoNoId: UserDisplayInfoNoId{
			Nickname:                sender.Nickname,
			Name:                    sender.Name,
			DpUrl:                   sender.DpUrl,
			DefaultProfilePicColors: sender.DefaultProfilePicColors,
		},
	}

	return &fr
}

func FriendRequestKey(recipientUserId string, senderUserId string) map[string]types.AttributeValue {
	return map[string]types.AttributeValue{
		"pk": &types.AttributeValueMemberS{Value: utils.AddPrefix(FriendRequestPkPrefix, recipientUserId)},
		"sk": &types.AttributeValueMemberS{Value: utils.AddPrefix(FriendRequestSkPrefix, senderUserId)},
	}
}

func (fr *friendRequest) ApplyPrefixes() {
	fr.RecipientId = utils.AddPrefix(FriendRequestPkPrefix, fr.RecipientId)
	fr.SenderId = utils.AddPrefix(FriendRequestSkPrefix, fr.SenderId)
}

func FriendRequestItemsToUserDisplayStructs(items *[]map[string]types.AttributeValue) *[]UserDisplayInfo {
	// TODO: write a unit test for this function
	// takes friends request items from the database and converts them to user display info
	// user id, nickname, name and display picture

	result := utils.DatabaseItemsToStructs(items, func(fr *friendRequest) {
		fr.RecipientId = strings.TrimPrefix(fr.RecipientId, FriendRequestPkPrefix)
		fr.SenderId = strings.TrimPrefix(fr.SenderId, FriendRequestSkPrefix)
	})

	var friendRequests []UserDisplayInfo

	for _, request := range *result {
		friendRequests = append(friendRequests, UserDisplayInfo{
			Userid:                  request.SenderId,
			Nickname:                request.Nickname,
			Name:                    request.Name,
			DpUrl:                   request.DpUrl,
			DefaultProfilePicColors: request.DefaultProfilePicColors,
		})
	}

	return &friendRequests
}
