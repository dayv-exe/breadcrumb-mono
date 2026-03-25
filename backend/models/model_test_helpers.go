package models

import (
	"backend/utils"
	"reflect"
	"testing"

	dbTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

func AssertDatabaseFormat(
	t *testing.T,
	model utils.DatabaseFormattable,
	expectedKeys map[string]dbTypes.AttributeValue,
	overrides map[string]dbTypes.AttributeValue,
) map[string]dbTypes.AttributeValue {
	t.Helper()

	result := *utils.ToDatabaseFormat(model)

	for key, val := range overrides {
		result[key] = val
	}

	for key, expVal := range expectedKeys {
		val, exists := result[key]
		if !exists {
			t.Errorf("Missing key: %v", key)
			continue
		}

		if reflect.TypeOf(val) != reflect.TypeOf(expVal) {
			t.Errorf("For key %v: expected type %v, got type %v", key, reflect.TypeOf(expVal), reflect.TypeOf(val))
			continue
		}

		if !reflect.DeepEqual(val, expVal) {
			t.Errorf("For key %v: expected %v, got %v", key, expVal, val)
		}
	}

	return result
}

// AssertDatabaseFormatKeyCount additionally checks that the total number of
// keys in the result matches the expected map (after overrides). Use this when
// you want a strict match — no extra or missing keys allowed.
func AssertDatabaseFormatKeyCount(
	t *testing.T,
	model utils.DatabaseFormattable,
	expectedKeys map[string]dbTypes.AttributeValue,
	overrides map[string]dbTypes.AttributeValue,
) map[string]dbTypes.AttributeValue {
	t.Helper()

	result := AssertDatabaseFormat(t, model, expectedKeys, overrides)

	if len(expectedKeys) != len(result) {
		t.Errorf("Expected %d keys, got %d", len(expectedKeys), len(result))
	}

	return result
}
