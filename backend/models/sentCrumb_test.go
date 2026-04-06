package models

import (
	"reflect"
	"testing"

	dbTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var TestSentCrumbDbItem = map[string]dbTypes.AttributeValue{
	"pk":               &dbTypes.AttributeValueMemberS{Value: "SENT_CRUMB#s1"},
	"sk":               &dbTypes.AttributeValueMemberS{Value: "RECEIVER#r1CRUMB_ID#c1"},
	"id":               &dbTypes.AttributeValueMemberS{Value: "c1"},
	"sender":           &dbTypes.AttributeValueMemberS{Value: "s1"},
	"receiver":         &dbTypes.AttributeValueMemberS{Value: "r1"},
	"lat":              &dbTypes.AttributeValueMemberN{Value: "50"},
	"lon":              &dbTypes.AttributeValueMemberN{Value: "-1"},
	"locationAccuracy": &dbTypes.AttributeValueMemberN{Value: "10"},
	"locationType":     &dbTypes.AttributeValueMemberS{Value: "gps"},
	"placeId":          &dbTypes.AttributeValueMemberL{Value: []dbTypes.AttributeValue{&dbTypes.AttributeValueMemberS{Value: "p1"}}},
	"time":             &dbTypes.AttributeValueMemberS{Value: "TIME#100"},
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
	"gsi2":    &dbTypes.AttributeValueMemberS{Value: "SENT_CRUMB#s1HASH#ha"},
	"gsi2Sk":  &dbTypes.AttributeValueMemberS{Value: "HASH#hashRECEIVER#r1CRUMB_ID#c1"},
	"gsi":     &dbTypes.AttributeValueMemberS{Value: "CRUMB_ID#c1"},
}

func NewTestCrumbBodySent() CrumbBody {
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

func TestSentCrumb_DatabaseFormat(t *testing.T) {
	body := NewTestCrumbBodySent()
	result := (*body.GetSentCrumbModels("s1"))[0]
	result.Geohash = "hash"
	result.PlaceId = []string{"p1"}
	result.Time = "100"

	expected := TestSentCrumbDbItem
	AssertDatabaseFormat(t, &result, expected, map[string]dbTypes.AttributeValue{
		"time": &dbTypes.AttributeValueMemberS{Value: "TIME#100"},
	})
}

func TestConvertToSentCrumbs(t *testing.T) {
	body := NewTestCrumbBodySent()
	expected := (*body.GetSentCrumbModels("s1"))[0]
	expected.Geohash = "hash"
	expected.PlaceId = []string{"p1"}
	expected.ApplyPrefixes()
	expected.Time = "100"

	results := (*ConvertToSentCrumbs([]map[string]dbTypes.AttributeValue{TestSentCrumbDbItem}))[0]

	if !reflect.DeepEqual(expected, results) {
		t.Errorf("Result: %v does not match expected: %v", results, expected)
	}
}

func TestSentCrumb_PrefixConstants(t *testing.T) {
	if SentCrumbPkPrefix != "SENT_CRUMB#" {
		t.Errorf("unexpected SentCrumbPkPrefix: %q", SentCrumbPkPrefix)
	}
	if SentCrumbSkPrefix != "RECEIVER#" {
		t.Errorf("unexpected SentCrumbSkPrefix: %q", SentCrumbSkPrefix)
	}
}
