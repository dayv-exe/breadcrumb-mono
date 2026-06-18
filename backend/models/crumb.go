package models

import (
	"backend/constants"
	"backend/utils"
	"math"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/mmcloughlin/geohash"
)

// get all crumbs sorted by timestamp
// get all crumbs in location (geohash)
// get crumb by id

const (
	CrumbPkPrefix = "CRUMB_RECEIVER#"

	CrumbReceiverPrefix = "CRUMB_RECEIVER#"
	CrumbSenderPrefix   = "CRUMB_SENDER#"

	CrumbIdPrefix      = "CRUMB_ID#"
	CrumbTimePrefix    = "TS#"
	CrumbGeohashPrefix = "GEOHASH#"
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
	Id               string       `json:"id"`
	Receivers        []string     `json:"receivers"`
	Lat              float64      `json:"lat"`
	Lon              float64      `json:"lon"`
	LocationAccuracy float32      `json:"locationAccuracy"`
	LocationType     string       `json:"locationType"`
	Text             []CrumbText  `json:"text"`
	MediaKeys        []CrumbMedia `json:"media"`
	ClickedFeatureId string       `json:"clickedFeatureId"`
}

type CrumbMarkerDetails struct {
	UserId                  string `json:"userid"`
	Nickname                string `json:"nickname"`
	ProfilePicture          string `json:"profilePicture"`
	ProfilePictureThumbnail string `json:"profilePictureThumbnail"`
}

type Crumb struct {
	Id               string       `json:"id" dynamodbav:"id"`
	SenderId         string       `json:"sender" dynamodbav:"sender"`
	Receiver         string       `json:"receiver" dynamodbav:"receiver"`
	Lat              float64      `json:"lat" dynamodbav:"lat"`
	Lon              float64      `json:"lon" dynamodbav:"lon"`
	LocationAccuracy float32      `json:"locationAccuracy" dynamodbav:"locationAccuracy"`
	LocationType     string       `json:"locationType" dynamodbav:"locationType"`
	PlaceId          string       `json:"placeId" dynamodbav:"placeId"`
	Text             []CrumbText  `json:"text" dynamodbav:"text"`
	Media            []CrumbMedia `json:"media" dynamodbav:"media"`
	Geohash          string       `json:"geohash" dynamodbav:"geohash"`
	Sent             bool         `json:"sent"`
	Opened           bool         `json:"opened" dynamodbav:"opened"`
	FormattedAddress string       `json:"formattedAddress" dynamodbav:"formattedAddress"`
	PlaceName        string       `json:"placename" dynamodbav:"placename"`

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
	if b.LocationType == constants.LOCATION_TYPE_NONE {
		b.LocationAccuracy = math.MaxInt32
	}
	crumbs := make([]Crumb, 0)
	for _, receiver := range b.Receivers {
		crumbs = append(crumbs, Crumb{
			Id:               b.Id,
			SenderId:         userId,
			Receiver:         receiver,
			Lat:              b.Lat,
			Lon:              b.Lon,
			LocationAccuracy: b.LocationAccuracy,
			LocationType:     b.LocationType,
			Text:             b.Text,
			Media:            b.MediaKeys,
			Geohash:          geohash.Encode(b.Lat, b.Lon),
			Time:             utils.GetNormalDateAndTime(),
			Opened:           false,
		})
	}

	return &crumbs
}

func (c *Crumb) ApplyPrefixes() {
	// access received crumbs by id
	// PK: UNOPENED_CRUMB_RECEIVER#{userid} SK: CRUMB#{crumbId}
	c.PK = CrumbPkPrefix + c.Receiver
	c.SK = CrumbIdPrefix + c.Id

	// access sent crumbs by id
	// GSI: CRUMB_SENDER#{senderId} GSISK: CRUMB_ID#{crumbId}
	c.Gsi = CrumbSenderPrefix + c.SenderId
	c.GsiSk = CrumbIdPrefix + c.Id

	// access received crumbs by timestamp
	// GSI2: CRUMB_RECEIVER#{userid} GSI2SK: TS#{timestamp}CRUMB_ID{crumbId}
	c.Gsi2 = CrumbReceiverPrefix + c.Receiver
	c.Gsi2Sk = CrumbTimePrefix + c.Time + CrumbIdPrefix + c.Id

	// access sent crumbs by timestamp
	// GSI3: CRUMB_SENDER#{userid} GSI3SK: TS#{timestamp}CRUMB_ID#{crumbId}
	c.Gsi3 = CrumbSenderPrefix + c.SenderId
	c.Gsi3Sk = CrumbTimePrefix + c.Time + CrumbIdPrefix + c.Id
}

func (c *Crumb) RemovePrefixes() {
}

// converts a slice of database items to a slice of crumbs (maybe)
func ConvertToCrumbs(items []map[string]types.AttributeValue) *[]Crumb {
	return utils.DatabaseItemsToStructs(items, func(c *Crumb) {
		c.RemovePrefixes()
	})
}

func CrumbKey(userId, crumbId string) *map[string]types.AttributeValue {
	return &map[string]types.AttributeValue{
		"pk": &types.AttributeValueMemberS{Value: CrumbPkPrefix + userId},
		"sk": &types.AttributeValueMemberS{Value: CrumbIdPrefix + crumbId},
	}
}
