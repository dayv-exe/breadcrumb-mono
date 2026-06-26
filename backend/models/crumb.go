package models

import (
	"backend/utils"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/mmcloughlin/geohash"
)

// get all crumbs sorted by timestamp
// get all crumbs in location (geohash)
// get crumb by id

const (
	SavedCrumbPkPrefix         = "SAVED_CRUMB_RECEIVER#"
	PrivateCrumbReceiverPrefix = "PRIVATE_CRUMB_RECEIVER#"
	CrumbPkPrefix              = "CRUMB_RECEIVER#"
	CrumbReceiverPrefix        = "CRUMB_RECEIVER#"
	CrumbSenderPrefix          = "CRUMB_SENDER#"
	CrumbIdPrefix              = "CRUMB_ID#"
	CrumbTimePrefix            = "TS#"
	CrumbGeohashPrefix         = "GEOHASH#"
)

type CrumbText struct {
	Index   int    `json:"index" dynamodbav:"index"`
	Content string `json:"content" dynamodbav:"content"`
}

type CrumbMedia struct {
	Index        int    `json:"index" dynamodbav:"index"`
	MediaKey     string `json:"media" dynamodbav:"media"`
	OverlayKey   string `json:"overlay,omitempty" dynamodbav:"overlay"`
	ThumbnailKey string `json:"thumbnail,omitempty" dynamodbav:"thumbnail"`
}

type CrumbBody struct {
	Id                      string       `json:"id"`
	Receivers               []string     `json:"receivers"`
	Latitude                float64      `json:"latitude"`
	Longitude               float64      `json:"longitude"`
	Radius                  float32      `json:"radius"`
	LocationSelectionManner string       `json:"locationSelectionManner"`
	Text                    []CrumbText  `json:"text"`
	MediaKeys               []CrumbMedia `json:"media"`
	ClickedFeatureId        string       `json:"clickedFeatureId"`
}

type CrumbMarkerDetails struct {
	UserId                  string `json:"userid"`
	Nickname                string `json:"nickname"`
	ProfilePicture          string `json:"profilePicture"`
	ProfilePictureThumbnail string `json:"profilePictureThumbnail"`
}

type Crumb struct {
	Id                      string       `json:"id" dynamodbav:"id"`
	Sender                  string       `json:"sender" dynamodbav:"sender"`
	Receiver                string       `json:"receiver" dynamodbav:"receiver"`
	Latitude                float64      `json:"latitude" dynamodbav:"latitude"`
	Longitude               float64      `json:"longitude" dynamodbav:"longitude"`
	Radius                  float32      `json:"radius" dynamodbav:"radius"`
	LocationSelectionManner string       `json:"locationSelectionManner" dynamodbav:"locationSelectionManner"`
	PlaceId                 string       `json:"placeId" dynamodbav:"placeId"`
	Text                    []CrumbText  `json:"text" dynamodbav:"text"`
	Media                   []CrumbMedia `json:"media" dynamodbav:"media"`
	Geohash                 string       `json:"geohash" dynamodbav:"geohash"`
	Sent                    bool         `json:"sent"`
	Private                 bool         `json:"private"`
	Saved                   bool         `json:"saved"`
	Unlocked                bool         `json:"unlocked" dynamodbav:"unlocked"`
	FormattedAddress        string       `json:"formattedAddress" dynamodbav:"formattedAddress"`
	PlaceName               string       `json:"placename" dynamodbav:"placename"`

	Time string `json:"time" dynamodbav:"time"`

	PK string `json:"-" dynamodbav:"pk"`
	SK string `json:"-" dynamodbav:"sk"`

	Gsi   string `json:"-" dynamodbav:"gsi"`
	GsiSk string `json:"-" dynamodbav:"gsiSk"`

	Gsi2   string `json:"-" dynamodbav:"gsi2"`
	Gsi2Sk string `json:"-" dynamodbav:"gsi2Sk"`

	Gsi3   string `json:"-" dynamodbav:"gsi3"`
	Gsi3Sk string `json:"-" dynamodbav:"gsi3Sk"`
}

type crumbKey struct {
	Key   string
	Value string
	Index *string
}

type CrumbCoordinates struct {
	Latitude  float64
	Longitude float64
}

// Returns a slice of crumb models one for each receiver
func (b *CrumbBody) GetCrumbs(userId string) *[]Crumb {
	crumbs := make([]Crumb, 0)
	for _, receiver := range b.Receivers {
		crumbs = append(crumbs, Crumb{
			Id:                      b.Id,
			Sender:                  userId,
			Receiver:                receiver,
			Latitude:                b.Latitude,
			Longitude:               b.Longitude,
			Radius:                  b.Radius,
			LocationSelectionManner: b.LocationSelectionManner,
			Text:                    b.Text,
			Media:                   b.MediaKeys,
			Geohash:                 geohash.Encode(b.Latitude, b.Longitude),
			Time:                    utils.GetNormalDateAndTime(),
			Unlocked:                false,
		})
	}

	return &crumbs
}

func (c *Crumb) ApplyPrefixes() {
	// access received crumbs by id
	// PK: CRUMB_RECEIVER#{userid} SK: CRUMB#{crumbId}
	c.PK = CrumbPkPrefix + c.Receiver
	c.SK = CrumbIdPrefix + c.Id

	// access sent crumbs by id
	// GSI: CRUMB_SENDER#{senderId} GSISK: CRUMB_ID#{crumbId}
	c.Gsi = CrumbSenderPrefix + c.Sender
	c.GsiSk = CrumbIdPrefix + c.Id

	// access received crumbs by timestamp
	// GSI2: CRUMB_RECEIVER#{userid} GSI2SK: TS#{timestamp}CRUMB_ID{crumbId}
	c.Gsi2 = CrumbReceiverPrefix + c.Receiver
	c.Gsi2Sk = CrumbTimePrefix + c.Time + CrumbIdPrefix + c.Id

	// access sent crumbs by timestamp
	// GSI3: CRUMB_SENDER#{userid} GSI3SK: TS#{timestamp}CRUMB_ID#{crumbId}
	c.Gsi3 = CrumbSenderPrefix + c.Sender
	c.Gsi3Sk = CrumbTimePrefix + c.Time + CrumbIdPrefix + c.Id

	if c.Receiver == c.Sender {
		// make private crumb

		// access private crumbs by id
		// PK: PRIVATE_CRUMB_RECEIVER#{userid} SK: CRUMB#{crumbId}
		c.PK = PrivateCrumbReceiverPrefix + c.Receiver

		// access private crumbs by id
		// GSI: PRIVATE_CRUMB_RECEIVER#{senderId} GSISK: CRUMB_ID#{crumbId}
		c.Gsi = PrivateCrumbReceiverPrefix + c.Receiver

		// access private crumbs by timestamp
		// GSI3: PRIVATE_CRUMB_RECEIVER#{userid} GSI3SK: TS#{timestamp}CRUMB_ID#{crumbId}
		c.Gsi3 = PrivateCrumbReceiverPrefix + c.Receiver

		// access private crumbs by timestamp
		// GSI2: CRUMB_RECEIVER#{userid} GSI2SK: TS#{timestamp}CRUMB_ID{crumbId}
		c.Gsi2 = PrivateCrumbReceiverPrefix + c.Receiver
	} else if c.Saved {
		// cannot save private crumb
		c.PK = SavedCrumbPkPrefix + c.Receiver
		c.Gsi2 = SavedCrumbPkPrefix + c.Receiver
	}
}

func (c *Crumb) RemovePrefixes() {
}

// converts a slice of database items to a slice of crumbs (maybe)
func ConvertToCrumbs(items []map[string]types.AttributeValue, onCrumbConverted func(*Crumb)) *[]Crumb {
	return utils.DatabaseItemsToStructs(items, func(c *Crumb) {
		onCrumbConverted(c)
		c.RemovePrefixes()
	})
}

func CrumbKey(userId, crumbId string) *map[string]types.AttributeValue {
	return &map[string]types.AttributeValue{
		"pk": &types.AttributeValueMemberS{Value: CrumbPkPrefix + userId},
		"sk": &types.AttributeValueMemberS{Value: CrumbIdPrefix + crumbId},
	}
}
