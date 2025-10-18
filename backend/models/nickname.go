package models

import (
	"backend/utils"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type Nickname struct {
	Nickname    string `dynamodbav:"pk" json:"nickname"`
	Description string `dynamodbav:"sk"`
	UserId      string `dynamodbav:"userId" json:"userId"`
}

const (
	nicknamePkPrefix = "NICKNAME#"
	nicknameSkPrefix = "NICKNAME"
)

// david kalu arubuike
// 1.) david = pk: fullname#da sk: fullname#david#123 normalized: david kalu arubuike raw: david kalu arubuike
// 2.) david = pk: fullname#ar sk: fullname#arubuike raw: david kalu arubuike
// 3.) david = pk: fullname#ka sk: fullname#kalu raw: david kalu arubuike

func NewNickname(nicknameStr string, userid string) *Nickname {
	return &Nickname{
		Nickname:    nicknameStr,
		Description: nicknameSkPrefix,
		UserId:      userid,
	}
}

func NicknameKey(nickname string) map[string]types.AttributeValue {
	return map[string]types.AttributeValue{
		"pk": &types.AttributeValueMemberS{Value: utils.AddPrefix(nicknamePkPrefix, strings.ToLower(nickname))},
		"sk": &types.AttributeValueMemberS{Value: nicknameSkPrefix},
	}
}

func (n *Nickname) ApplyPrefixes() {
	n.Nickname = utils.AddPrefix(nicknamePkPrefix, n.Nickname)
}

func ConvertToNickname(item map[string]types.AttributeValue) *Nickname {
	return utils.DatabaseItemToStruct(item, func(n *Nickname) {
		n.UserId = strings.TrimPrefix(n.UserId, nicknamePkPrefix)
	})
}
