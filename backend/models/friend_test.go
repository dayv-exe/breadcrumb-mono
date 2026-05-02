package models

import (
	"backend/utils"
	"reflect"
	"strconv"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func TestFriendDatabaseFormat(t *testing.T) {
	d := utils.GetUnixTimestamp()

	expected := map[string]types.AttributeValue{
		"pk":       &types.AttributeValueMemberS{Value: "USER#123"},
		"sk":       &types.AttributeValueMemberS{Value: "FRIEND#321"},
		"fullname": &types.AttributeValueMemberS{Value: "sender"},
		"gsi":      &types.AttributeValueMemberS{Value: "sndr"},
		"date":     &types.AttributeValueMemberN{Value: strconv.FormatInt(d, 10)},
	}

	otherUser := NewUser("321", "sndr", "sender", false)

	result := utils.ToDatabaseFormat(NewFriendship("123", otherUser))

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

func TestFriendToUserInfoStruct(t *testing.T) {
	friendDbItem := []map[string]types.AttributeValue{
		{
			"pk":       &types.AttributeValueMemberS{Value: "123"},
			"sk":       &types.AttributeValueMemberS{Value: "321"},
			"gsi":      &types.AttributeValueMemberS{Value: "other"},
			"fullname": &types.AttributeValueMemberS{Value: "other"},
			"date":     &types.AttributeValueMemberN{Value: strconv.FormatInt(time.Now().Unix(), 10)},
		},
	}

	expect := UserDisplayInfo{
		Userid:   "321",
		Nickname: "other",
		Name:     "other",
	}

	result := FriendItemsToUserDisplayStructs(friendDbItem)

	if !reflect.DeepEqual((*result)[0], expect) {
		t.Errorf("expected %v, got %v", expect, (*result)[0])
	}
}
