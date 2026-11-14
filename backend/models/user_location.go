package models

import (
	"backend/constants"
	"backend/utils"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

const (
	UserLocationPkPrefix = "USER#"
	UserLocationSkPrefix = "LOCATION"
)

type UserLocation struct {
	Userid     string           `dynamodbav:"userid"`
	Coordinate utils.Coordinate `dynamodbav:"coordinate"`
	Timestamp  string           `dynamodbav:"timestamp"`

	Pk  string `dynamodbav:"pk"`
	Sk  string `dynamodbav:"sk"`
	TTL int64  `dynamodbav:"ttl"`
}

func NewLocation(coordinate utils.Coordinate) *UserLocation {
	return &UserLocation{
		Userid:     utils.GetAuthenticatedUserid(),
		Coordinate: coordinate,
		Timestamp:  utils.GetNormalDateAndTime(),
		TTL:        time.Now().Add(constants.USER_LOCATION_TTL).Unix(),
	}
}

func (u *UserLocation) ApplyPrefixes() {
	u.Pk = UserLocationPkPrefix + u.Userid
	u.Sk = UserLocationSkPrefix
}

func ConvertItemToUserLocation(item map[string]types.AttributeValue) UserLocation {
	return *utils.DatabaseItemToStruct(item, func(ul *UserLocation) {})
}

func UserLocationKey(userid string) *map[string]types.AttributeValue {
	return &map[string]types.AttributeValue{
		"pk": &types.AttributeValueMemberS{Value: UserLocationPkPrefix + userid},
		"sk": &types.AttributeValueMemberS{Value: UserLocationSkPrefix},
	}
}
