package models

import (
	"reflect"
	"testing"

	dbTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var TestCrumbDbItem = map[string]dbTypes.AttributeValue{
	"pk":               &dbTypes.AttributeValueMemberS{Value: "CRUMB#r1"},
	"sk":               &dbTypes.AttributeValueMemberS{Value: "SENDER#s1CRUMB_ID#c1"},
	"id":               &dbTypes.AttributeValueMemberS{Value: "c1"},
	"sender":           &dbTypes.AttributeValueMemberS{Value: "s1"},
	"receiver":         &dbTypes.AttributeValueMemberS{Value: "r1"},
	"lat":              &dbTypes.AttributeValueMemberN{Value: "50"},
	"lon":              &dbTypes.AttributeValueMemberN{Value: "-1"},
	"locationAccuracy": &dbTypes.AttributeValueMemberN{Value: "10"},
	"locationType":     &dbTypes.AttributeValueMemberS{Value: "gps"},
	"placeId":          &dbTypes.AttributeValueMemberL{Value: []dbTypes.AttributeValue{&dbTypes.AttributeValueMemberS{Value: "p1"}}},
	"lsi":              &dbTypes.AttributeValueMemberS{Value: "TIME#100"},
	"text": &dbTypes.AttributeValueMemberM{Value: map[string]dbTypes.AttributeValue{
		"index":   &dbTypes.AttributeValueMemberN{Value: "0"},
		"content": &dbTypes.AttributeValueMemberS{Value: "hello world"},
	}},
	"media": &dbTypes.AttributeValueMemberL{Value: []dbTypes.AttributeValue{
		&dbTypes.AttributeValueMemberM{Value: map[string]dbTypes.AttributeValue{
			"index":     &dbTypes.AttributeValueMemberN{Value: "0"},
			"media":     &dbTypes.AttributeValueMemberS{Value: "img-key-1"},
			"overlay":   &dbTypes.AttributeValueMemberS{Value: ""},
			"thumbnail": &dbTypes.AttributeValueMemberS{Value: ""},
		}},
	}},
	"geohash":   &dbTypes.AttributeValueMemberS{Value: "hash"},
	"gsiHashPk": &dbTypes.AttributeValueMemberS{Value: "CRUMB#r1HASH#ha"},
	"gsiHashSk": &dbTypes.AttributeValueMemberS{Value: "HASH#hashSENDER#s1"},
	"gsi":       &dbTypes.AttributeValueMemberS{Value: "CRUMB_ID#c1"},
}

func NewTestCrumbBody() CrumbBody {
	return CrumbBody{
		Receivers:        []string{"r1"},
		Lat:              50,
		Lon:              -1,
		LocationAccuracy: 10,
		LocationType:     "gps",
		Text: crumbText{
			Index:   0,
			Content: "hello world",
		},
		MediaKeys: []crumbMedia{{Index: 0, MediaKey: "img-key-1"}},
	}
}

func TestCrumb_DatabaseFormat(t *testing.T) {
	body := NewTestCrumbBody()
	result := (*body.GetCrumbs("c1", "s1"))[0]
	result.Geohash = "hash"
	result.PlaceId = []string{"p1"}
	result.Time = "100"

	expected := TestCrumbDbItem
	AssertDatabaseFormat(t, &result, expected, map[string]dbTypes.AttributeValue{
		"lsi": &dbTypes.AttributeValueMemberS{Value: "TIME#100"},
	})
}

func TestConvertToCrumbs(t *testing.T) {
	body := NewTestCrumbBody()
	expected := (*body.GetCrumbs("c1", "s1"))[0]
	expected.Geohash = "hash"
	expected.PlaceId = []string{"p1"}
	expected.ApplyPrefixes()
	expected.Time = "100"

	results := (*ConvertToCrumbs([]map[string]dbTypes.AttributeValue{TestCrumbDbItem}))[0]

	if !reflect.DeepEqual(expected, results) {
		t.Errorf("Result: %v does not match expected: %v", results, expected)
	}
}
