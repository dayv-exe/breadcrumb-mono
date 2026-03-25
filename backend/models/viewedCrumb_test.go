package models

import (
	"backend/utils"
	"strings"
	"testing"

	dbTypes "github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

var testViewedCrumbDynamo = map[string]dbTypes.AttributeValue{
	"pk":               &dbTypes.AttributeValueMemberS{Value: "VIEWED_CRUMB#receiver-1"},
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

func newTestViewedCrumb() ViewedCrumb {
	return ViewedCrumb{
		Crumb{
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
		},
	}
}

func TestGetViewedCrumbModels_SingleReceiver(t *testing.T) {
	body := CrumbBody{
		Receivers:        []string{"receiver-1"},
		Lat:              51.5074,
		Lon:              -0.1278,
		LocationAccuracy: 10.0,
		LocationType:     "gps",
		Text:             crumbText{Index: 0, Content: "hello"},
		MediaKeys:        []crumbMedia{{Index: 0, MediaKey: "img-key-1"}},
	}

	crumbs := body.GetViewedCrumbModels("crumb-id-1", "sender-1")

	if crumbs == nil {
		t.Fatal("expected non-nil result")
	}
	if len(*crumbs) != 1 {
		t.Fatalf("expected 1 viewed crumb, got %d", len(*crumbs))
	}

	c := (*crumbs)[0]
	if c.Id != "crumb-id-1" {
		t.Errorf("expected id 'crumb-id-1', got %q", c.Id)
	}
	if c.SenderId != "sender-1" {
		t.Errorf("expected sender 'sender-1', got %q", c.SenderId)
	}
	if c.Receiver != "receiver-1" {
		t.Errorf("expected receiver 'receiver-1', got %q", c.Receiver)
	}
	if c.Lat != 51.5074 {
		t.Errorf("expected lat 51.5074, got %f", c.Lat)
	}
	if c.Lon != -0.1278 {
		t.Errorf("expected lon -0.1278, got %f", c.Lon)
	}
	if c.Text.Content != "hello" {
		t.Errorf("expected text 'hello', got %q", c.Text.Content)
	}
	if len(c.Media) != 1 || c.Media[0].MediaKey != "img-key-1" {
		t.Errorf("unexpected media: %+v", c.Media)
	}
	if c.Time == "" {
		t.Error("expected non-empty time")
	}
}

func TestGetViewedCrumbModels_MultipleReceivers(t *testing.T) {
	body := CrumbBody{
		Receivers:    []string{"recv-1", "recv-2", "recv-3"},
		Lat:          40.7128,
		Lon:          -74.0060,
		LocationType: "gps",
		Text:         crumbText{Index: 0, Content: "broadcast"},
	}

	crumbs := body.GetViewedCrumbModels("shared-crumb-id", "sender-abc")

	if len(*crumbs) != 3 {
		t.Fatalf("expected 3 viewed crumbs, got %d", len(*crumbs))
	}

	// All share the same crumb ID (unlike regular crumbs which get unique IDs)
	for i, c := range *crumbs {
		if c.Id != "shared-crumb-id" {
			t.Errorf("crumb %d: expected id 'shared-crumb-id', got %q", i, c.Id)
		}
		if c.SenderId != "sender-abc" {
			t.Errorf("crumb %d: expected sender 'sender-abc', got %q", i, c.SenderId)
		}
	}

	expectedReceivers := []string{"recv-1", "recv-2", "recv-3"}
	for i, c := range *crumbs {
		if c.Receiver != expectedReceivers[i] {
			t.Errorf("crumb %d: expected receiver %q, got %q", i, expectedReceivers[i], c.Receiver)
		}
	}
}

func TestGetViewedCrumbModels_EmptyReceivers(t *testing.T) {
	body := CrumbBody{Receivers: []string{}}

	crumbs := body.GetViewedCrumbModels("id", "sender")

	if len(*crumbs) != 0 {
		t.Fatalf("expected 0 viewed crumbs, got %d", len(*crumbs))
	}
}

func TestViewedCrumb_ApplyPrefixes(t *testing.T) {
	vc := newTestViewedCrumb()
	vc.ApplyPrefixes()

	// PK uses VIEWED_CRUMB# prefix, not CRUMB#
	expectedPK := "VIEWED_CRUMB#receiver-1"
	if vc.PK != expectedPK {
		t.Errorf("expected PK %q, got %q", expectedPK, vc.PK)
	}

	// SK uses ViewedCrumbSkPrefix
	expectedSK := "SENDER#sender-1CRUMB_ID#crumb-id-1"
	if vc.SK != expectedSK {
		t.Errorf("expected SK %q, got %q", expectedSK, vc.SK)
	}

	// Hash fields should use VIEWED_CRUMB# prefix
	if !strings.HasPrefix(vc.HashSmall, "VIEWED_CRUMB#receiver-1#GEOS#") {
		t.Errorf("HashSmall missing expected prefix, got %q", vc.HashSmall)
	}
	if !strings.HasPrefix(vc.HashMid, "VIEWED_CRUMB#receiver-1#GEOM#") {
		t.Errorf("HashMid missing expected prefix, got %q", vc.HashMid)
	}
	if !strings.HasPrefix(vc.HashBig, "VIEWED_CRUMB#"+"receiver-1"+"#"+"GEOB#") {
		t.Errorf("HashBig missing expected prefix, got %q", vc.HashBig)
	}
	if !strings.HasPrefix(vc.HashVBig, "VIEWED_CRUMB#"+"receiver-1"+"#"+"GEOV#") {
		t.Errorf("HashVBig missing expected prefix, got %q", vc.HashVBig)
	}

	// HashSk
	expectedHashSk := "SENDER#" + "sender-1" + "#" + "crumb-id-1"
	if vc.HashSk != expectedHashSk {
		t.Errorf("expected HashSk %q, got %q", expectedHashSk, vc.HashSk)
	}

	// Time
	if !strings.HasPrefix(vc.Time, "TIME#") {
		t.Errorf("Time should start with %q, got %q", CrumbTimePrefix, vc.Time)
	}
}

func TestViewedCrumb_RemovePrefixes(t *testing.T) {
	vc := newTestViewedCrumb()
	vc.ApplyPrefixes()

	timeBefore := strings.TrimPrefix(vc.Time, CrumbTimePrefix)
	vc.RemovePrefixes()

	// Note: ViewedCrumb.RemovePrefixes sets PK=SenderId, SK=Receiver (opposite of Crumb)
	if vc.PK != "sender-1" {
		t.Errorf("expected PK 'sender-1' after removal, got %q", vc.PK)
	}
	if vc.SK != "receiver-1" {
		t.Errorf("expected SK 'receiver-1' after removal, got %q", vc.SK)
	}
	if vc.HashSk != "sender-1" {
		t.Errorf("expected HashSk 'sender-1' after removal, got %q", vc.HashSk)
	}

	// Geo hashes should be bare H3 cells
	for name, h := range map[string]string{
		"HashSmall": vc.HashSmall,
		"HashMid":   vc.HashMid,
		"HashBig":   vc.HashBig,
		"HashVBig":  vc.HashVBig,
	} {
		if h == "" {
			t.Errorf("%s is empty after prefix removal", name)
		}
		if strings.Contains(h, "VIEWED_CRUMB#") {
			t.Errorf("%s still contains VIEWED_CRUMB# prefix: %q", name, h)
		}
		if strings.Contains(h, "GEOS#") || strings.Contains(h, "GEOM#") ||
			strings.Contains(h, "GEOB#") || strings.Contains(h, "GEOV#") {
			t.Errorf("%s still contains geo prefix: %q", name, h)
		}
	}

	if vc.Time != timeBefore {
		t.Errorf("expected time %q after removal, got %q", timeBefore, vc.Time)
	}
}

func TestViewedCrumb_DatabaseFormat(t *testing.T) {
	vc := newTestViewedCrumb()
	vc.ApplyPrefixes()

	result := AssertDatabaseFormat(t, &vc, testViewedCrumbDynamo, nil)

	// Verify geo hash fields exist and are strings
	for _, geoKey := range []string{"gsiGhSmall", "gsiGhMid", "gsiGhBig", "gsiGhVBig", "hashGsiSk"} {
		val, exists := result[geoKey]
		if !exists {
			t.Errorf("Missing geo hash key: %v", geoKey)
			continue
		}
		if _, ok := val.(*dbTypes.AttributeValueMemberS); !ok {
			t.Errorf("For key %v: expected AttributeValueMemberS, got %T", geoKey, val)
		}
	}

	if _, exists := result["lsi"]; !exists {
		t.Error("Missing time key 'lsi'")
	}
}

func TestConvertToViewedCrumbs(t *testing.T) {
	vc := newTestViewedCrumb()
	vc.ApplyPrefixes()

	dbItem := utils.ToDatabaseFormat(&vc)
	results := ConvertToViewedCrumbs([]map[string]dbTypes.AttributeValue{*dbItem})

	if results == nil {
		t.Fatal("expected non-nil result")
	}
	if len(*results) != 1 {
		t.Fatalf("expected 1 viewed crumb, got %d", len(*results))
	}

	got := (*results)[0]

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
	if got.Text.Content != "hello world" {
		t.Errorf("expected text 'hello world', got %q", got.Text.Content)
	}
	if len(got.Media) != 1 || got.Media[0].MediaKey != "img-key-1" {
		t.Errorf("unexpected media: %+v", got.Media)
	}

	// ViewedCrumb sets PK=SenderId, SK=Receiver after RemovePrefixes
	if got.PK != "sender-1" {
		t.Errorf("expected PK 'sender-1' after round-trip, got %q", got.PK)
	}
	if got.SK != "receiver-1" {
		t.Errorf("expected SK 'receiver-1' after round-trip, got %q", got.SK)
	}
	if got.HashSk != "sender-1" {
		t.Errorf("expected HashSk 'sender-1' after round-trip, got %q", got.HashSk)
	}
}

func TestConvertToViewedCrumbs_Multiple(t *testing.T) {
	vc1 := newTestViewedCrumb()
	vc1.ApplyPrefixes()

	vc2 := newTestViewedCrumb()
	vc2.Id = "crumb-id-2"
	vc2.SenderId = "sender-2"
	vc2.Lat = 40.7128
	vc2.Lon = -74.0060
	vc2.ApplyPrefixes()

	items := []map[string]dbTypes.AttributeValue{
		*utils.ToDatabaseFormat(&vc1),
		*utils.ToDatabaseFormat(&vc2),
	}

	results := ConvertToViewedCrumbs(items)

	if len(*results) != 2 {
		t.Fatalf("expected 2 viewed crumbs, got %d", len(*results))
	}
	if (*results)[0].Id != "crumb-id-1" {
		t.Errorf("first: expected id 'crumb-id-1', got %q", (*results)[0].Id)
	}
	if (*results)[1].Id != "crumb-id-2" {
		t.Errorf("second: expected id 'crumb-id-2', got %q", (*results)[1].Id)
	}
}

func TestConvertToViewedCrumbs_EmptySlice(t *testing.T) {
	results := ConvertToViewedCrumbs([]map[string]dbTypes.AttributeValue{})

	if results == nil {
		t.Fatal("expected non-nil result for empty input")
	}
	if len(*results) != 0 {
		t.Errorf("expected 0 viewed crumbs, got %d", len(*results))
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
