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

type Friend struct {
	ThisUserId          string `dynamodbav:"pk"`
	OtherUserID         string `dynamodbav:"sk"`
	UserDisplayInfoNoId        // this denormalized info of the other user
	Date                string `dynamodbav:"date"`
}

func NewFriendship(thisUserId string, otherUser *User) *Friend {
	// Returns 2 friendship items
	return &Friend{
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

func (f *Friend) ApplyPrefixes() {
	f.ThisUserId = utils.AddPrefix(FriendItemPk, f.ThisUserId)
	f.OtherUserID = utils.AddPrefix(FriendItemSk, f.OtherUserID)
	f.Nickname = utils.AddPrefix(nicknamePkPrefix, f.Nickname)
}

func DbItemToFriendStruct(item map[string]types.AttributeValue) *Friend {
	return utils.DatabaseItemToStruct(item, func(f *Friend) {
		f.ThisUserId = strings.TrimPrefix(f.ThisUserId, FriendItemPk)
		f.OtherUserID = strings.TrimPrefix(f.OtherUserID, FriendItemSk)
		f.Nickname = strings.TrimPrefix(f.Nickname, nicknamePkPrefix)
	})
}

// TODO: write unit test for this function
func FriendItemsToUserDisplayStructs(items []map[string]types.AttributeValue) *[]UserDisplayInfo {
	// convert db items to friends
	result := utils.DatabaseItemsToStructs(items, func(f *Friend) {
		f.ThisUserId = strings.TrimPrefix(f.ThisUserId, FriendItemPk)
		f.OtherUserID = strings.TrimPrefix(f.OtherUserID, FriendItemSk)
		f.Nickname = strings.TrimPrefix(f.Nickname, nicknamePkPrefix)
	})

	// convert friends to user display info
	var friends []UserDisplayInfo
	for _, Friend := range *result {
		friends = append(friends, UserDisplayInfo{
			Userid:                  Friend.OtherUserID,
			Nickname:                Friend.Nickname,
			Name:                    Friend.Name,
			DpUrl:                   Friend.DpUrl,
			DefaultProfilePicColors: Friend.DefaultProfilePicColors,
		})
	}

	return &friends
}
