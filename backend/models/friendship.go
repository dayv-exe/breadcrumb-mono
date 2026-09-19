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

	PictureUrl string `json:"pictureUrl" dynamodbav:"pictureUrl"`
	Name       string `json:"name" dynamodbav:"name"`
	Nickname   string `json:"nickname" dynamodbav:"nickname"`

	CreatedAt int64 `json:"createdAt" dynamodbav:"createdAt"`
	Timestamp int64 `json:"timestamp" dynamodbav:"timestamp"`

	Status string `json:"status" dynamobdav:"status"`

	Pk string `json:"-" dynamodbav:"pk"`
	Sk string `json:"-" dynamodbav:"sk"`

	Gsi   string `json:"-" dynamodbav:"gsi"`
	GsiSk string `json:"-" dynamodbav:"gsiSk"`
}

func NewFriendship(currentUser, otherUser User, createdAt int64) (*Friendship, *Friendship) {
	ts := time.Now().Unix()

	return &Friendship{
			FriendId:   otherUser.Userid,
			PictureUrl: otherUser.ProfilePicture.ThumbnailKey,
			Name:       otherUser.Name,
			Nickname:   otherUser.Nickname,
			Timestamp:  ts,
			Status:     constants.FRIENDSHIP_STATUS_ACTIVE,
			CreatedAt:  createdAt,
		}, &Friendship{
			FriendId:   currentUser.Userid,
			PictureUrl: currentUser.ProfilePicture.ThumbnailKey,
			Name:       currentUser.Name,
			Nickname:   currentUser.Nickname,
			Timestamp:  ts,
			Status:     constants.FRIENDSHIP_STATUS_ACTIVE,
			CreatedAt:  createdAt,
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

func (f *Friendship) GetKey() map[string]types.AttributeValue {
	return map[string]types.AttributeValue{
		"pk": &types.AttributeValueMemberS{Value: FriendshipPkPrefix + f.FriendId},
		"sk": &types.AttributeValueMemberS{Value: FriendshipTimestampPrefix + fmt.Sprint(f.Timestamp)},
	}
}
