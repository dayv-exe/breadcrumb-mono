package models

import (
	"backend/utils"
	"reflect"
	"testing"

	dbTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var testUserDynamo = map[string]dbTypes.AttributeValue{
	"pk":                    &dbTypes.AttributeValueMemberS{Value: "USER#123"},
	"sk":                    &dbTypes.AttributeValueMemberS{Value: "PROFILE"},
	"gsi":                   &dbTypes.AttributeValueMemberS{Value: "test"},
	"fullname":              &dbTypes.AttributeValueMemberS{Value: "test test"},
	"bio":                   &dbTypes.AttributeValueMemberS{Value: ""},
	"is_suspended":          &dbTypes.AttributeValueMemberBOOL{Value: false},
	"is_deactivated":        &dbTypes.AttributeValueMemberBOOL{Value: false},
	"date":                  &dbTypes.AttributeValueMemberS{Value: utils.GetTimeNow()},
	"can_change_birthdate":  &dbTypes.AttributeValueMemberBOOL{Value: true},
	"last_nickname_change":  &dbTypes.AttributeValueMemberS{Value: ""},
	"last_name_change":      &dbTypes.AttributeValueMemberS{Value: ""},
	"last_email_change":     &dbTypes.AttributeValueMemberS{Value: ""},
	"last_login":            &dbTypes.AttributeValueMemberS{Value: utils.GetTimeNow()},
	"force_change_nickname": &dbTypes.AttributeValueMemberBOOL{Value: false},
	"suspension_reason":     &dbTypes.AttributeValueMemberS{Value: ""},
	"friends":               &dbTypes.AttributeValueMemberS{Value: ""},
}

func TestUser_DatabaseFormat(t *testing.T) {
	user := NewUser(
		"123",
		"test",
		"test test",
		false,
	)

	result := *utils.ToDatabaseFormat(user)

	if len(testUserDynamo) != len(result) {
		t.Errorf("Expected %d keys, got %d", len(testUserDynamo), len(result))
	}

	for key, expVal := range testUserDynamo {
		val, exists := result[key]
		if !exists {
			t.Errorf("Missing key: %v", key)
			continue
		}

		if reflect.TypeOf(val) != reflect.TypeOf(expVal) {
			t.Errorf("For key %v: expected type: %v, but got type: %v", key, reflect.TypeOf(expVal), reflect.TypeOf(val))
			continue
		}

		if !reflect.DeepEqual(val, expVal) {
			t.Errorf("For key %v: expected %v, got %v", key, expVal, val)
			continue
		}
	}
}

func TestConvertToUser(t *testing.T) {
	expect := User{
		UserDisplayInfo: UserDisplayInfo{
			Userid:   "123",
			Nickname: "test",
			Name:     "test",
		},
		UserAccountInfo: UserAccountInfo{
			Bio:           "",
			IsSuspended:   false,
			IsDeactivated: false,
		},
	}

	result := ConvertToUser(map[string]dbTypes.AttributeValue{
		"pk":             &dbTypes.AttributeValueMemberS{Value: "USER#123"},
		"gsi":            &dbTypes.AttributeValueMemberS{Value: "test"},
		"fullname":       &dbTypes.AttributeValueMemberS{Value: "test"},
		"bio":            &dbTypes.AttributeValueMemberS{Value: ""},
		"is_suspended":   &dbTypes.AttributeValueMemberBOOL{Value: false},
		"is_deactivated": &dbTypes.AttributeValueMemberBOOL{Value: false},
	})

	if !reflect.DeepEqual(*result, expect) {
		t.Errorf("Result: %v does not match expected: %v", result, expect)
	}
}
