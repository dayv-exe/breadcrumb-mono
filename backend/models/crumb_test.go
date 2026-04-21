package models

import (
	"reflect"
	"testing"

	dbTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var TestCrumbDbItem = map[string]dbTypes.AttributeValue{
	"pk":               &dbTypes.AttributeValueMemberS{Value: "UNOPENED_CRUMB_RECEIVER#r1"},
	"sk":               &dbTypes.AttributeValueMemberS{Value: "CRUMB_ID#c1"},
	"id":               &dbTypes.AttributeValueMemberS{Value: "c1"},
	"sender":           &dbTypes.AttributeValueMemberS{Value: "s1"},
	"receiver":         &dbTypes.AttributeValueMemberS{Value: "r1"},
	"lat":              &dbTypes.AttributeValueMemberN{Value: "50"},
	"lon":              &dbTypes.AttributeValueMemberN{Value: "-1"},
	"locationAccuracy": &dbTypes.AttributeValueMemberN{Value: "10"},
	"locationType":     &dbTypes.AttributeValueMemberS{Value: "gps"},
	"placeId":          &dbTypes.AttributeValueMemberL{Value: []dbTypes.AttributeValue{&dbTypes.AttributeValueMemberS{Value: "p1"}}},
	"time":             &dbTypes.AttributeValueMemberS{Value: "100"},
	"text": &dbTypes.AttributeValueMemberL{Value: []dbTypes.AttributeValue{
		&dbTypes.AttributeValueMemberM{Value: map[string]dbTypes.AttributeValue{
			"index":   &dbTypes.AttributeValueMemberN{Value: "0"},
			"content": &dbTypes.AttributeValueMemberS{Value: "hello world"},
		},
		},
	}},
	"media": &dbTypes.AttributeValueMemberL{Value: []dbTypes.AttributeValue{
		&dbTypes.AttributeValueMemberM{Value: map[string]dbTypes.AttributeValue{
			"index":     &dbTypes.AttributeValueMemberN{Value: "0"},
			"media":     &dbTypes.AttributeValueMemberS{Value: "img-key-1"},
			"overlay":   &dbTypes.AttributeValueMemberS{Value: ""},
			"thumbnail": &dbTypes.AttributeValueMemberS{Value: ""},
		}},
	}},
	"geohash": &dbTypes.AttributeValueMemberS{Value: "hash"},
	"gsi":     &dbTypes.AttributeValueMemberS{Value: "CRUMB_SENDER#s1"},
	"gsiSk":   &dbTypes.AttributeValueMemberS{Value: "CRUMB_ID#c1"},
	"gsi2":    &dbTypes.AttributeValueMemberS{Value: "CRUMB_RECEIVER#r1"},
	"gsi2Sk":  &dbTypes.AttributeValueMemberS{Value: "TS#100CRUMB_ID#c1"},
	"gsi3":    &dbTypes.AttributeValueMemberS{Value: "CRUMB_SENDER#s1"},
	"gsi3Sk":  &dbTypes.AttributeValueMemberS{Value: "TS#100CRUMB_ID#c1"},
}

func NewTestCrumbBody() CrumbBody {
	return CrumbBody{
		Id:               "c1",
		Receivers:        []string{"r1"},
		Lat:              50,
		Lon:              -1,
		LocationAccuracy: 10,
		LocationType:     "gps",
		Text: []CrumbText{
			{
				Index:   0,
				Content: "hello world",
			},
		},
		MediaKeys: []CrumbMedia{{Index: 0, MediaKey: "img-key-1"}},
	}
}

func TestCrumb_DatabaseFormat(t *testing.T) {
	body := NewTestCrumbBody()
	result := (*body.GetCrumbs("s1"))[0]
	result.Geohash = "hash"
	result.PlaceId = []string{"p1"}
	result.Time = "100"

	expected := TestCrumbDbItem
	AssertDatabaseFormat(t, &result, expected, map[string]dbTypes.AttributeValue{
		"gsi2Sk": &dbTypes.AttributeValueMemberS{Value: "TS#100CRUMB_ID#c1"},
		"gsi3Sk": &dbTypes.AttributeValueMemberS{Value: "TS#100CRUMB_ID#c1"},
	})
}

func TestConvertToCrumbs(t *testing.T) {
	body := NewTestCrumbBody()
	expected := (*body.GetCrumbs("s1"))[0]
	expected.Geohash = "hash"
	expected.PlaceId = []string{"p1"}
	expected.ApplyPrefixes()
	expected.Time = "100"
	expected.Gsi2Sk = "TS#100CRUMB_ID#c1"
	expected.Gsi3Sk = "TS#100CRUMB_ID#c1"

	results := (*ConvertToCrumbs([]map[string]dbTypes.AttributeValue{TestCrumbDbItem}))[0]

	if !reflect.DeepEqual(expected, results) {
		// t.Errorf("Result: %v does not match expected: %v", results, expected)
		t.Errorf("Result and expected MISMATCH:\n%v\n%v", results, expected)
	}
}
