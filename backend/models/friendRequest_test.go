package models

import (
	"backend/utils"
	"reflect"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func TestFriendRequestDbFormat(t *testing.T) {
	d := utils.GetTimeNow()
	expected := map[string]types.AttributeValue{
		"pk":       &types.AttributeValueMemberS{Value: "USER#rec"},
		"sk":       &types.AttributeValueMemberS{Value: "FRIEND_REQUEST_FROM#send"},
		"date":     &types.AttributeValueMemberS{Value: d},
		"fullname": &types.AttributeValueMemberS{Value: "test"},
		"gsi":      &types.AttributeValueMemberS{Value: "test"},
		"gsi2Sk":   &types.AttributeValueMemberS{Value: "USER#rec"},
		"gsi2":     &types.AttributeValueMemberS{Value: "FRIEND_REQUEST_FROM#send"},
	}

	fr := friendRequest{
		RecipientId: "rec",
		SenderId:    "send",
		Date:        d,
		UserDisplayInfoNoId: UserDisplayInfoNoId{
			Name:     "test",
			Nickname: "test",
		},
	}

	result := utils.ToDatabaseFormat(&fr)

	if len(*result) != len(expected) {
		t.Fatalf("Expected %d keys, got %d", len(expected), len(*result))
	}

	for key, expVal := range expected {
		val, exists := (*result)[key]
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

func TestConvertToFriendRequest(t *testing.T) {
	d := utils.GetTimeNow()
	expected := UserDisplayInfo{
		Userid:   "send",
		Nickname: "send",
		Name:     "send",
	}

	item := []map[string]types.AttributeValue{
		{
			"pk":       &types.AttributeValueMemberS{Value: "USER#rec"},
			"sk":       &types.AttributeValueMemberS{Value: "FRIEND_REQUEST_FROM#send"},
			"gsi":      &types.AttributeValueMemberS{Value: "send"},
			"gsi2":     &types.AttributeValueMemberS{Value: "USER#rec"},
			"gsi2Sk":   &types.AttributeValueMemberS{Value: "FRIEND_REQUEST_FROM#send"},
			"fullname": &types.AttributeValueMemberS{Value: "send"},
			"date":     &types.AttributeValueMemberS{Value: d},
		},
	}

	results := FriendRequestItemsToUserDisplayStructs(item)
	if !reflect.DeepEqual((*results)[0], expected) {
		t.Errorf("Result: %v does not match expected: %v", (*results)[0], expected)
	}
}

func TestFriendRequestToUserInfoStruct(t *testing.T) {
	friendReqDbItem := []map[string]types.AttributeValue{
		{
			"pk":       &types.AttributeValueMemberS{Value: "123"},
			"sk":       &types.AttributeValueMemberS{Value: "321"},
			"gsi":      &types.AttributeValueMemberS{Value: "other"},
			"gsi2":     &types.AttributeValueMemberS{Value: "USER#rec"},
			"gsi2Sk":   &types.AttributeValueMemberS{Value: "FRIEND_REQUEST_FROM#send"},
			"fullname": &types.AttributeValueMemberS{Value: "other"},
			"date":     &types.AttributeValueMemberS{Value: ""},
		},
	}

	expect := UserDisplayInfo{
		Userid:   "321",
		Nickname: "other",
		Name:     "other",
	}

	result := FriendRequestItemsToUserDisplayStructs(friendReqDbItem)

	if !reflect.DeepEqual((*result)[0], expect) {
		t.Errorf("expected %v, got %v", expect, (*result)[0])
	}
}
