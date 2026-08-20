package models

import (
	"backend/utils"
	"os"
	"reflect"
	"testing"

	dbTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var TestCrumbDbItem = map[string]dbTypes.AttributeValue{
	// received crumb: owner = receiver (r1), other user = sender (s1)
	"pk":                      &dbTypes.AttributeValueMemberS{Value: "CRUMB_OWNER#r1"},
	"sk":                      &dbTypes.AttributeValueMemberS{Value: "TS#100CRUMB_ID#c1r1s1OTHER_USER#s1"},
	"nonCompositeId":          &dbTypes.AttributeValueMemberS{Value: "c1"},
	"id":                      &dbTypes.AttributeValueMemberS{Value: "c1r1s1"},
	"sender":                  &dbTypes.AttributeValueMemberS{Value: "s1"},
	"receiver":                &dbTypes.AttributeValueMemberS{Value: "r1"},
	"latitude":                &dbTypes.AttributeValueMemberN{Value: "50"},
	"longitude":               &dbTypes.AttributeValueMemberN{Value: "-1"},
	"radius":                  &dbTypes.AttributeValueMemberN{Value: "10"},
	"locationSelectionManner": &dbTypes.AttributeValueMemberS{Value: "gps"},
	"placeId":                 &dbTypes.AttributeValueMemberS{Value: "p1"},
	"time":                    &dbTypes.AttributeValueMemberS{Value: "100"},
	"caption": &dbTypes.AttributeValueMemberL{Value: []dbTypes.AttributeValue{
		&dbTypes.AttributeValueMemberM{Value: map[string]dbTypes.AttributeValue{
			"index":   &dbTypes.AttributeValueMemberN{Value: "0"},
			"content": &dbTypes.AttributeValueMemberS{Value: "hello world"},
		}},
	}},
	"media": &dbTypes.AttributeValueMemberL{Value: []dbTypes.AttributeValue{
		&dbTypes.AttributeValueMemberM{Value: map[string]dbTypes.AttributeValue{
			"index":     &dbTypes.AttributeValueMemberN{Value: "0"},
			"media":     &dbTypes.AttributeValueMemberS{Value: "img-key-1"},
			"thumbnail": &dbTypes.AttributeValueMemberS{Value: ""},
		}},
	}},
	"geohash": &dbTypes.AttributeValueMemberS{Value: "hash"},

	// new fields on Crumb
	"unlocked":         &dbTypes.AttributeValueMemberBOOL{Value: false},
	"formattedAddress": &dbTypes.AttributeValueMemberS{Value: "1 Test Street"},
	"placename":        &dbTypes.AttributeValueMemberS{Value: ""},

	// gsi owner is the receiver for a received crumb
	"gsi":   &dbTypes.AttributeValueMemberS{Value: "CRUMB_OWNER#r1"},
	"gsiSk": &dbTypes.AttributeValueMemberS{Value: "CRUMB_ID#c1r1s1OTHER_USER#s1"},

	"gsi2":   &dbTypes.AttributeValueMemberS{Value: "CRUMB_ID#c1"},
	"gsi2Sk": &dbTypes.AttributeValueMemberS{Value: "CRUMB_OWNER#r1OTHER_USER#s1"},
}

func TestMain(m *testing.M) {
	utils.ResolveAuthenticatedUserForTesting("r1")
	os.Exit(m.Run())
}

func NewTestCrumbBody() CrumbBody {
	return CrumbBody{
		Id:                      "c1",
		Receivers:               []string{"r1"},
		Latitude:                50,
		Longitude:               -1,
		Radius:                  10,
		LocationSelectionManner: "gps",
		Caption: []CrumbCaption{
			{
				Index:   0,
				Content: "hello world",
			},
		},
		MediaKeys: []CrumbMedia{{Index: 0, MediaKey: "img-key-1"}},
		Address:   "1 Test Street",
	}
}

func TestCrumb_DatabaseFormat(t *testing.T) {
	body := NewTestCrumbBody()
	result := CreateReceivedCrumb(&body, "s1", "r1")
	result.Geohash = "hash"
	result.PlaceId = "p1"
	result.Time = "100"

	AssertDatabaseFormat(t, &result, TestCrumbDbItem, nil)
}

func TestConvertToCrumbs(t *testing.T) {
	body := NewTestCrumbBody()
	expected := CreateReceivedCrumb(&body, "s1", "r1")
	expected.Geohash = "hash"
	expected.PlaceId = "p1"
	expected.Time = "100"
	expected.ApplyPrefixes()
	expected.Owner = ""
	expected.OtherUser = ""

	results := (*ConvertToCrumbs([]map[string]dbTypes.AttributeValue{TestCrumbDbItem}, func(c *Crumb) {

	}))[0]

	if !reflect.DeepEqual(expected, results) {
		t.Errorf("Result and expected MISMATCH:\n%v\n%v", results, expected)
	}
}
