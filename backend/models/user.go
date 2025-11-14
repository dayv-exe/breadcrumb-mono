package models

// standard user db model

import (
	"backend/utils"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type User struct {
	UserDisplayInfo
	UserAccountInfo
	UserPersonalInfo
	DbDescription string `dynamodbav:"sk" json:"type"`
}

type UserDisplayInfo struct {
	Userid                  string `dynamodbav:"pk" json:"userId"`
	Nickname                string `dynamodbav:"gsi" json:"nickname"`
	Name                    string `dynamodbav:"fullname" json:"name"`
	DpUrl                   string `dynamodbav:"dpUrl" json:"dpUrl"`
	DefaultProfilePicColors string `dynamodbav:"default_pic_colors" json:"defaultPicColors"`
}

type UserDisplayInfoNoId struct {
	Nickname                string `dynamodbav:"gsi" json:"nickname"`
	Name                    string `dynamodbav:"fullname" json:"name"`
	DpUrl                   string `dynamodbav:"dpUrl" json:"dpUrl"`
	DefaultProfilePicColors string `dynamodbav:"default_pic_colors" json:"defaultPicColors"`
}

type UserAccountInfo struct {
	Bio              string `dynamodbav:"bio" json:"bio"`
	FriendshipStatus string `dynamodbav:"friends" json:"friends"`
	IsSuspended      bool   `dynamodbav:"is_suspended" json:"isSuspended"`
	IsDeactivated    bool   `dynamodbav:"is_deactivated" json:"isDeactivated"`
	DateJoined       string `dynamodbav:"date" json:"date"`
}

type UserPersonalInfo struct {
	CanChangeBirthdate  bool   `dynamodbav:"can_change_birthdate" json:"canChangeBirthdate,omitempty"`
	LastNicknameChange  string `dynamodbav:"last_nickname_change" json:"-"`
	LastEmailChange     string `dynamodbav:"last_email_change" json:"-"`
	LastNameChange      string `dynamodbav:"last_name_change" json:"-"`
	AllowNicknameChange bool   `dynamodbav:"-" json:"allowNicknameChange,omitempty"`
	AllowEmailChange    bool   `dynamodbav:"-" json:"allowEmailChange,omitempty"`
	AllowNameChange     bool   `dynamodbav:"-" json:"allowNameChange,omitempty"`
	LastLogin           string `dynamodbav:"last_login" json:"lastLogin,omitempty"`
	ForceChangeNickname bool   `dynamodbav:"force_change_nickname,omitempty" json:"forceChangeNickname"`
	SuspensionReason    string `dynamodbav:"suspension_reason" json:"suspensionReason,omitempty"`
}

const (
	UserPkPrefix = "USER#"
	UserSkPrefix = "PROFILE"
)

func NewUser(userid string, nickname string, name string, isSuspended bool) *User {
	defaultColors := utils.GenerateRandomColorPair()

	return &User{
		UserDisplayInfo: UserDisplayInfo{
			Userid:                  userid,
			Nickname:                nickname,
			Name:                    name,
			DpUrl:                   "",
			DefaultProfilePicColors: defaultColors.Foreground + utils.AddPrefix("#", defaultColors.Background),
		},
		UserAccountInfo: UserAccountInfo{
			Bio:           "",
			IsSuspended:   isSuspended,
			IsDeactivated: false,
			DateJoined:    utils.GetTimeNow(),
		},
		UserPersonalInfo: UserPersonalInfo{
			CanChangeBirthdate:  true,
			LastNicknameChange:  "",
			LastEmailChange:     "",
			LastLogin:           utils.GetTimeNow(),
			LastNameChange:      "",
			ForceChangeNickname: false,
			SuspensionReason:    "",
		},
		DbDescription: UserSkPrefix,
	}
}

func GetUserDisplayInfoNoId(u *User) *UserDisplayInfoNoId {
	return &UserDisplayInfoNoId{
		Nickname:                u.Nickname,
		Name:                    u.Name,
		DpUrl:                   u.DpUrl,
		DefaultProfilePicColors: u.DefaultProfilePicColors,
	}
}

func NewUserDisplayInfo(u User) *UserDisplayInfo {
	return &UserDisplayInfo{
		Userid:                  u.Userid,
		Nickname:                u.Nickname,
		Name:                    u.Name,
		DpUrl:                   u.DpUrl,
		DefaultProfilePicColors: u.DefaultProfilePicColors,
	}
}

func UserKey(userid string) map[string]types.AttributeValue {
	return map[string]types.AttributeValue{
		"pk": &types.AttributeValueMemberS{Value: utils.AddPrefix(UserPkPrefix, userid)},
		"sk": &types.AttributeValueMemberS{Value: UserSkPrefix},
	}
}

func (u *User) ApplyPrefixes() {
	u.Userid = utils.AddPrefix(UserPkPrefix, u.Userid)
}

func ConvertToUsers(items []map[string]types.AttributeValue) *[]User {
	users := utils.DatabaseItemsToStructs(items, func(u *User) {
		u.Userid = strings.TrimPrefix(u.Userid, UserPkPrefix)
	})

	return users
}

func ConvertToUser(item map[string]types.AttributeValue) *User {
	return &(*ConvertToUsers([]map[string]types.AttributeValue{item}))[0]
}
