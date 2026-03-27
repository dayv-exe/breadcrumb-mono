package models

import (
	"backend/utils"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/mmcloughlin/geohash"
)

const (
	CrumbPkPrefix   = "CRUMB#"
	CrumbSkPrefix   = "SENDER#"
	CrumbIdPrefix   = "CRUMB_ID#"
	CrumbTimePrefix = "TIME#"
	CrumbHashPrefix = "HASH#"
)

type crumbText struct {
	Index   int    `json:"index" dynamodbav:"index"`
	Content string `json:"content" dynamodbav:"content"`
}

type crumbMedia struct {
	Index        int    `json:"index" dynamodbav:"index"`
	MediaKey     string `json:"media" dynamodbav:"media"`
	OverlayKey   string `json:"overlay,omitempty" dynamodbav:"overlay"`
	ThumbnailKey string `json:"thumbnail,omitempty" dynamodbav:"thumbnail"`
}

type CrumbBody struct {
	Receivers        []string     `json:"receivers"`
	Lat              float64      `json:"lat"`
	Lon              float64      `json:"lon"`
	LocationAccuracy float32      `json:"locationAccuracy"`
	LocationType     string       `json:"locationType"`
	Text             crumbText    `json:"text"`
	MediaKeys        []crumbMedia `json:"media"`
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
	Text             crumbText    `json:"text" dynamodbav:"text"`
	Media            []crumbMedia `json:"media" dynamodbav:"media"`
	Geohash          string       `json:"geohash" dynamodbav:"geohash"`

	Time string `json:"time" dynamodbav:"lsi"`

	HashPk string `json:"-" dynamodbav:"gsiHashPk"`
	HashSk string `json:"-" dynamodbav:"gsiHashSk"`

	PK  string `json:"-" dynamodbav:"pk"`
	SK  string `json:"-" dynamodbav:"sk"`
	Gsi string `json:"-" dynamodbav:"gsi"`
}

// Returns a slice of crumb models one for each receiver
func (b *CrumbBody) GetCrumbs(crumbId, userId string) *[]Crumb {
	crumbs := make([]Crumb, 0)
	for _, receiver := range b.Receivers {
		crumbs = append(crumbs, Crumb{
			Id:               crumbId,
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
		})
	}

	return &crumbs
}

func (c *Crumb) ApplyPrefixes() {
	c.PK = CrumbPkPrefix + c.Receiver
	c.SK = CrumbSkPrefix + c.SenderId + CrumbIdPrefix + c.Id
	c.Gsi = CrumbIdPrefix + c.Id

	c.HashPk = CrumbPkPrefix + c.Receiver + CrumbHashPrefix + c.Geohash[:2]
	c.HashSk = CrumbHashPrefix + c.Geohash + CrumbSkPrefix + c.SenderId

	c.Time = CrumbTimePrefix + utils.GetDateAndTime()
}

func (c *Crumb) RemovePrefixes() {
	c.Time = strings.ReplaceAll(c.Time, CrumbTimePrefix, "")
}

// converts a slice of database items to a slice of crumbs (maybe)
func ConvertToCrumbs(items []map[string]types.AttributeValue) *[]Crumb {
	return utils.DatabaseItemsToStructs(items, func(c *Crumb) {
		c.RemovePrefixes()
	})
}
