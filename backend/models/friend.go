package models

import (
	"backend/utils"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

const (
	FriendItemPk = "USER#"
	FriendItemSk = "FRIEND#"
)

type friend struct {
	ThisUserId          string `dynamodbav:"pk"`
	OtherUserID         string `dynamodbav:"sk"`
	UserDisplayInfoNoId        // this denormalized info of the other user
	Date                string `dynamodbav:"date"`
}

func NewFriendship(thisUserId string, otherUser *User) *friend {
	// Returns 2 friendship items
	return &friend{
		ThisUserId:          thisUserId,
		OtherUserID:         otherUser.Userid,
		UserDisplayInfoNoId: *GetUserDisplayInfoNoId(otherUser),
		Date:                utils.GetTimeNow(),
	}
}

func FriendKey(thisUserId string, otherUserId string) map[string]types.AttributeValue {
	return map[string]types.AttributeValue{
		"pk": &types.AttributeValueMemberS{Value: utils.AddPrefix(FriendItemPk, thisUserId)},
		"sk": &types.AttributeValueMemberS{Value: utils.AddPrefix(FriendItemSk, otherUserId)},
	}
}

func (f *friend) ApplyPrefixes() {
	f.ThisUserId = utils.AddPrefix(FriendItemPk, f.ThisUserId)
	f.OtherUserID = utils.AddPrefix(FriendItemSk, f.OtherUserID)
}

// TODO: write unit test for this function
func FriendItemsToUserDisplayStructs(items *[]map[string]types.AttributeValue) *[]UserDisplayInfo {
	// convert db items to friends
	result := utils.DatabaseItemsToStructs(items, func(f *friend) {
		f.ThisUserId = strings.TrimPrefix(f.ThisUserId, FriendItemPk)
		f.OtherUserID = strings.TrimPrefix(f.OtherUserID, FriendItemSk)
	})

	// convert friends to user display info
	var friends []UserDisplayInfo
	for _, friend := range *result {
		friends = append(friends, UserDisplayInfo{
			Userid:                  friend.OtherUserID,
			Nickname:                friend.Nickname,
			Name:                    friend.Name,
			DpUrl:                   friend.DpUrl,
			DefaultProfilePicColors: friend.DefaultProfilePicColors,
		})
	}

	return &friends
}
