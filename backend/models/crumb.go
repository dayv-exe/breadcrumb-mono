package models

import (
	"backend/utils"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/mmcloughlin/geohash"
)

const (
	UnopenedCrumbPkPrefix = "UNOPENED_CRUMB_RECEIVER#"
	OpenedCrumbPkPrefix   = "OPENED_CRUMB_RECEIVER#"

	CrumbReceiverPrefix = "CRUMB_RECEIVER#"
	CrumbSenderPrefix   = "CRUMB_SENDER#"

	CrumbIdPrefix      = "CRUMB_ID#"
	CrumbTimePrefix    = "TIME#"
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
}

type Crumb struct {
	Id               string       `json:"id" dynamodbav:"id"`
	SenderId         string       `json:"sender" dynamodbav:"sender"`
	Receiver         string       `json:"receiver" dynamodbav:"receiver"`
	Lat              float64      `json:"lat" dynamodbav:"lat"`
	Lon              float64      `json:"lon" dynamodbav:"lon"`
	LocationAccuracy float32      `json:"locationAccuracy" dynamodbav:"locationAccuracy"`
	LocationType     string       `json:"locationType" dynamodbav:"locationType"`
	PlaceId          []string     `json:"placeId" dynamodbav:"placeId"`
	Text             []CrumbText  `json:"text" dynamodbav:"text"`
	Media            []CrumbMedia `json:"media" dynamodbav:"media"`
	Geohash          string       `json:"geohash" dynamodbav:"geohash"`
	Opened           bool         `json:"opened" dynamodbav:"opened"`

	Time string `json:"time" dynamodbav:"time"`

	PK string `json:"-" dynamodbav:"pk"`
	SK string `json:"-" dynamodbav:"sk"`

	Gsi   string `json:"-" dynamodbav:"gsi"`
	GsiSk string `json:"-" dynamodbav:"gsiSk"`

	Gsi2   string `json:"-" dynamodbav:"gsi2"`
	Gsi2Sk string `json:"-" dynamodbav:"gsi2Sk"`

	Gsi3   string `json:"-" dynamodbav:"gsi3"`
	Gsi3Sk string `json:"-" dynamodbav:"gsi3Sk"`

	Gsi4 string `json:"-" dynamodbav:"gsi4"`

	Gsi5   string `json:"-" dynamodbav:"gsi5"`
	Gsi5Sk string `json:"-" dynamodbav:"gsi5Sk"`
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
			Time:             utils.GetDateAndTime(),
			Opened:           false,
		})
	}

	return &crumbs
}

func (c *Crumb) ApplyPrefixes() {
	crumbPk := UnopenedCrumbPkPrefix + c.Receiver
	if c.Opened {
		crumbPk = OpenedCrumbPkPrefix + c.Receiver
	}
	// access received crumbs
	// PK: UNOPENED_CRUMB_RECEIVER#{userid} SK: GEOHASH#{hash}CRUMB_ID#{crumbId}
	c.PK = crumbPk
	c.SK = CrumbGeohashPrefix + c.Geohash + CrumbIdPrefix + c.Id

	// access received crumbs from particular sender
	// GSI: CRUMB_RECEIVER#{userid} GSISK: CRUMB_SENDER#{userid}GEOHASH#{hash}CRUMB_ID#{crumbId}
	c.Gsi = CrumbReceiverPrefix + c.Receiver
	c.GsiSk = CrumbSenderPrefix + c.SenderId + CrumbGeohashPrefix + c.Geohash + CrumbIdPrefix + c.Id

	// access sent crumbs
	// GSI2: CRUMB_SENDER#{userid} GSI2SK: GEOHASH#{hash}CRUMB_ID#{crumbId}
	c.Gsi2 = CrumbSenderPrefix + c.SenderId
	c.Gsi2Sk = CrumbGeohashPrefix + c.Geohash + CrumbIdPrefix + c.Id

	// access sent crumbs to particular user
	// GSI3: CRUMB_SENDER#{userid} GSI3SK: CRUMB_RECEIVER#{userid}GEOHASH#{hash}CRUMB_ID#{crumbId}
	c.Gsi3 = CrumbSenderPrefix + c.SenderId
	c.Gsi3Sk = CrumbReceiverPrefix + c.Receiver + CrumbGeohashPrefix + c.Geohash + CrumbIdPrefix + c.Id

	// access crumb by id
	c.Gsi4 = CrumbIdPrefix + c.Id

	// access received crumbs and order by age
	// GSI5: CRUMB_RECEIVER#{userid} GSI5SK: TIME#{time}CRUMB_SENDER#{send_id}CRUMB_ID#{crumbId}
	c.Gsi5 = CrumbReceiverPrefix + c.Receiver
	c.GsiSk = CrumbTimePrefix + c.Time + CrumbSenderPrefix + c.SenderId + CrumbIdPrefix + c.Id
}

func fGetCrumbKeys(userId, otherUserId, geohash, crumbId string, isReceived, opened bool) (crumbKey, crumbKey) {
	key1 := crumbKey{}
	key2 := crumbKey{}

	hasOtherUser := strings.TrimSpace(otherUserId) != ""

	if isReceived {
		if hasOtherUser {
			// received from a particular sender -> GSI
			// GSI: CRUMB_RECEIVER#{userid}  GSISK: CRUMB_SENDER#{userid}GEOHASH#{hash}CRUMB_ID#{crumbId}
			key1.Key = "gsi"
			key1.Index = aws.String("GSIndex1")
			key2.Key = "gsiSk"
			key2.Index = aws.String("GSIndex1")

			key1.Value = CrumbReceiverPrefix + userId
			key2.Value = CrumbSenderPrefix + otherUserId
		} else {
			// received (filtered by opened/unopened) -> base table
			// PK: (UN)OPENED_CRUMB_RECEIVER#{userid}  SK: GEOHASH#{hash}CRUMB_ID#{crumbId}
			key1.Key = "pk"
			key1.Index = nil
			key2.Key = "sk"
			key2.Index = nil

			if !opened {
				key1.Value = UnopenedCrumbPkPrefix + userId
			} else {
				key1.Value = OpenedCrumbPkPrefix + userId
			}
		}
	} else {
		if hasOtherUser {
			// sent to a particular receiver -> GSI3
			// GSI3: CRUMB_SENDER#{userid}  GSI3SK: CRUMB_RECEIVER#{userid}GEOHASH#{hash}CRUMB_ID#{crumbId}
			key1.Key = "gsi3"
			key1.Index = aws.String("GSIndex3")
			key2.Key = "gsi3Sk"
			key2.Index = aws.String("GSIndex3")

			key1.Value = CrumbSenderPrefix + userId
			key2.Value = CrumbReceiverPrefix + otherUserId
		} else {
			// sent -> GSI2
			// GSI2: CRUMB_SENDER#{userid}  GSI2SK: GEOHASH#{hash}CRUMB_ID#{crumbId}
			key1.Key = "gsi2"
			key1.Index = aws.String("GSIndex2")
			key2.Key = "gsi2Sk"
			key2.Index = aws.String("GSIndex2")

			key1.Value = CrumbSenderPrefix + userId
		}
	}

	if strings.TrimSpace(geohash) != "" {
		key2.Value += CrumbGeohashPrefix + geohash
	}

	if strings.TrimSpace(crumbId) != "" {
		key2.Value += CrumbIdPrefix + crumbId
	}

	return key1, key2
}

func (c *Crumb) RemovePrefixes() {
}

// converts a slice of database items to a slice of crumbs (maybe)
func ConvertToCrumbs(items []map[string]types.AttributeValue) *[]Crumb {
	return utils.DatabaseItemsToStructs(items, func(c *Crumb) {
		c.RemovePrefixes()
	})
}
