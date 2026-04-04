package models

import (
	"reflect"
	"testing"

	dbTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var TestViewedCrumbDbItem = map[string]dbTypes.AttributeValue{
	"pk":               &dbTypes.AttributeValueMemberS{Value: "VIEWED_CRUMB#r1"},
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
	"gsi2":    &dbTypes.AttributeValueMemberS{Value: "VIEWED_CRUMB#r1HASH#ha"},
	"gsi2Sk":  &dbTypes.AttributeValueMemberS{Value: "HASH#hashSENDER#s1CRUMB_ID#c1"},
	"gsi":     &dbTypes.AttributeValueMemberS{Value: "CRUMB_ID#c1"},
}

func NewTestCrumbBodyViewed() CrumbBody {
	return CrumbBody{
		Id:               "c1",
		Receivers:        []string{"r1"},
		Lat:              50,
		Lon:              -1,
		LocationAccuracy: 10,
		LocationType:     "gps",
		Text: []crumbText{
			{
				Index:   0,
				Content: "hello world",
			},
		},
		MediaKeys: []crumbMedia{{Index: 0, MediaKey: "img-key-1"}},
	}
}

func TestViewedCrumb_DatabaseFormat(t *testing.T) {
	body := NewTestCrumbBodyViewed()
	result := (*body.GetViewedCrumbModels("s1"))[0]
	result.Geohash = "hash"
	result.PlaceId = []string{"p1"}

	expected := TestViewedCrumbDbItem
	AssertDatabaseFormat(t, &result, expected, map[string]dbTypes.AttributeValue{
		"lsi": &dbTypes.AttributeValueMemberS{Value: "TIME#100"},
	})
}

func TestConvertToViewedCrumbs(t *testing.T) {
	body := NewTestCrumbBodyViewed()
	expected := (*body.GetViewedCrumbModels("s1"))[0]
	expected.Geohash = "hash"
	expected.PlaceId = []string{"p1"}
	expected.ApplyPrefixes()
	expected.Time = "100"

	results := (*ConvertToViewedCrumbs([]map[string]dbTypes.AttributeValue{TestViewedCrumbDbItem}))[0]

	if !reflect.DeepEqual(expected, results) {
		t.Errorf("Result: %v does not match expected: %v", results, expected)
	}
}

func TestViewedCrumb_PrefixConstants(t *testing.T) {
	if ViewedCrumbPkPrefix != "VIEWED_CRUMB#" {
		t.Errorf("unexpected ViewedCrumbPkPrefix: %q", ViewedCrumbPkPrefix)
	}
	if ViewedCrumbSkPrefix != "SENDER#" {
		t.Errorf("unexpected ViewedCrumbSkPrefix: %q", ViewedCrumbSkPrefix)
	}
}
