package models

import (
	"backend/constants"
	"backend/utils"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

const (
	FriendshipPkPrefix        = "USER#"
	FriendshipFriendIdPrefix  = "FRIEND_ID#"
	FriendshipTimestampPrefix = "FRIENDSHIP_TIMESTAMP#"
)

type Friendship struct {
	FriendId string `json:"friendId" dynamodbav:"friendId"`

	PictureUrl  string `json:"pictureUrl" dynamodbav:"pictureUrl"`
	Name        string `json:"name" dynamodbav:"name"`
	Nickname    string `json:"nickname" dynamodbav:"nickname"`
	DisplayName string `json:"displayName" dynamodbav:"displayName"`

	CreatedAt int64 `json:"createdAt" dynamodbav:"createdAt"`
	Timestamp int64 `json:"timestamp" dynamodbav:"timestamp"`

	Status string `json:"status" dynamobdav:"status"`

	Pk string `json:"-" dynamodbav:"pk"`
	Sk string `json:"-" dynamodbav:"sk"`

	Gsi   string `json:"-" dynamodbav:"gsi"`
	GsiSk string `json:"-" dynamodbav:"gsiSk"`
}

func NewFriendship(currentUser, otherUser User) (*Friendship, *Friendship) {
	ts := time.Now().Unix()

	return &Friendship{
			FriendId:    otherUser.Userid,
			PictureUrl:  otherUser.ProfilePicture.ThumbnailKey,
			Name:        otherUser.Name,
			Nickname:    otherUser.Nickname,
			DisplayName: otherUser.Name,
			CreatedAt:   ts,
			Timestamp:   ts,
			Status:      constants.FRIENDSHIP_STATUS_ACTIVE,
		}, &Friendship{
			FriendId:    currentUser.Userid,
			PictureUrl:  currentUser.ProfilePicture.ThumbnailKey,
			Name:        currentUser.Name,
			Nickname:    currentUser.Nickname,
			DisplayName: currentUser.Name,
			CreatedAt:   ts,
			Timestamp:   ts,
			Status:      constants.FRIENDSHIP_STATUS_ACTIVE,
		}
}

func (f *Friendship) ApplyPrefixes() {
	userid := utils.GetAuthenticatedUserid()

	f.Pk = FriendshipPkPrefix + userid
	f.Sk = FriendshipTimestampPrefix + fmt.Sprint(f.Timestamp) + FriendshipFriendIdPrefix + f.FriendId

	f.Gsi = FriendshipPkPrefix + userid
	f.GsiSk = FriendshipFriendIdPrefix + f.FriendId + FriendshipTimestampPrefix + fmt.Sprint(f.Timestamp)
}

func ConvertDbItemsToFriendshipStructs(items []map[string]types.AttributeValue) *[]Friendship {
	return utils.DatabaseItemsToStructs[Friendship](items, nil)
}
