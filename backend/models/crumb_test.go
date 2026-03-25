package models

import (
	"backend/utils"
	"testing"

	dbTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var testCrumbDynamo = map[string]dbTypes.AttributeValue{
	"pk":               &dbTypes.AttributeValueMemberS{Value: "CRUMB#receiver-1"},
	"sk":               &dbTypes.AttributeValueMemberS{Value: "SENDER#sender-1CRUMB_ID#crumb-id-1"},
	"id":               &dbTypes.AttributeValueMemberS{Value: "crumb-id-1"},
	"sender":           &dbTypes.AttributeValueMemberS{Value: "sender-1"},
	"receiver":         &dbTypes.AttributeValueMemberS{Value: "receiver-1"},
	"lat":              &dbTypes.AttributeValueMemberN{Value: "51.5074"},
	"lon":              &dbTypes.AttributeValueMemberN{Value: "-0.1278"},
	"locationAccuracy": &dbTypes.AttributeValueMemberN{Value: "10"},
	"locationType":     &dbTypes.AttributeValueMemberS{Value: "gps"},
	"placeId":          &dbTypes.AttributeValueMemberL{Value: []dbTypes.AttributeValue{&dbTypes.AttributeValueMemberS{Value: "place-abc"}}},
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
}

// TODO: test access keys

func newTestCrumb() Crumb {
	return Crumb{
		Id:               "crumb-id-1",
		SenderId:         "sender-1",
		Receiver:         "receiver-1",
		Lat:              51.5074,
		Lon:              -0.1278,
		LocationAccuracy: 10,
		LocationType:     "gps",
		PlaceId:          []string{"place-abc"},
		Text:             crumbText{Index: 0, Content: "hello world"},
		Media:            []crumbMedia{{Index: 0, MediaKey: "img-key-1"}},
	}
}

func TestCrumb_DatabaseFormat(t *testing.T) {
	crumb := newTestCrumb()
	AssertDatabaseFormat(t, &crumb, testCrumbDynamo, nil)
}

func TestConvertToCrumbs(t *testing.T) {
	crumb := newTestCrumb()

	dbItem := *utils.ToDatabaseFormat(&crumb)

	results := ConvertToCrumbs([]map[string]dbTypes.AttributeValue{dbItem})

	if results == nil {
		t.Fatal("expected non-nil result")
	}
	if len(*results) != 1 {
		t.Fatalf("expected 1 crumb, got %d", len(*results))
	}

	got := (*results)[0]

	// After RemovePrefixes, the core fields should match the original input
	if got.Id != "crumb-id-1" {
		t.Errorf("expected id 'crumb-id-1', got %q", got.Id)
	}
	if got.SenderId != "sender-1" {
		t.Errorf("expected sender 'sender-1', got %q", got.SenderId)
	}
	if got.Receiver != "receiver-1" {
		t.Errorf("expected receiver 'receiver-1', got %q", got.Receiver)
	}
	if got.Lat != 51.5074 {
		t.Errorf("expected lat 51.5074, got %f", got.Lat)
	}
	if got.Lon != -0.1278 {
		t.Errorf("expected lon -0.1278, got %f", got.Lon)
	}
	if got.LocationAccuracy != 10 {
		t.Errorf("expected location accuracy 10, got %f", got.LocationAccuracy)
	}
	if got.LocationType != "gps" {
		t.Errorf("expected location type 'gps', got %q", got.LocationType)
	}
	if got.Text.Content != "hello world" {
		t.Errorf("expected text content 'hello world', got %q", got.Text.Content)
	}
	if len(got.Media) != 1 || got.Media[0].MediaKey != "img-key-1" {
		t.Errorf("expected 1 media with key 'img-key-1', got %+v", got.Media)
	}

	// Prefixes should be stripped
	if got.PK != "receiver-1" {
		t.Errorf("expected PK 'receiver-1' after prefix removal, got %q", got.PK)
	}
	if got.SK != "sender-1" {
		t.Errorf("expected SK 'sender-1' after prefix removal, got %q", got.SK)
	}
	if got.HashSk != "sender-1" {
		t.Errorf("expected HashSk 'sender-1' after prefix removal, got %q", got.HashSk)
	}
}

func TestConvertToCrumbs_MultipleCrumbs(t *testing.T) {
	crumb1 := newTestCrumb()

	crumb2 := newTestCrumb()
	crumb2.Id = "crumb-id-2"
	crumb2.SenderId = "sender-2"
	crumb2.Lat = 40.7128
	crumb2.Lon = -74.0060

	items := []map[string]dbTypes.AttributeValue{
		*utils.ToDatabaseFormat(&crumb1),
		*utils.ToDatabaseFormat(&crumb2),
	}

	results := ConvertToCrumbs(items)

	if len(*results) != 2 {
		t.Fatalf("expected 2 crumbs, got %d", len(*results))
	}

	if (*results)[0].Id != "crumb-id-1" {
		t.Errorf("first crumb: expected id 'crumb-id-1', got %q", (*results)[0].Id)
	}
	if (*results)[1].Id != "crumb-id-2" {
		t.Errorf("second crumb: expected id 'crumb-id-2', got %q", (*results)[1].Id)
	}
}

func TestConvertToCrumbs_EmptySlice(t *testing.T) {
	results := ConvertToCrumbs([]map[string]dbTypes.AttributeValue{})

	if results == nil {
		t.Fatal("expected non-nil result for empty input")
	}
	if len(*results) != 0 {
		t.Errorf("expected 0 crumbs, got %d", len(*results))
	}
}
