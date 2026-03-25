package models

import (
	"backend/constants"
	"backend/utils"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/uber/h3-go/v4"
)

const (
	CrumbPkPrefix        = "CRUMB#"
	CrumbSkPrefix        = "SENDER#"
	CrumbIdPrefix        = "CRUMB_ID#"
	CrumbTimePrefix      = "TIME#"
	CrumbHashSmallPrefix = "GEOS#"
	CrumbHashMidPrefix   = "GEOM#"
	CrumbHashBigPrefix   = "GEOB#"
	CrumbHashVBigPrefix  = "GEOV#"
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

	Time string `json:"time" dynamodbav:"lsi"`

	HashSmall string `json:"-" dynamodbav:"gsiGhSmall"`
	HashMid   string `json:"-" dynamodbav:"gsiGhMid"`
	HashBig   string `json:"-" dynamodbav:"gsiGhBig"`
	HashVBig  string `json:"-" dynamodbav:"gsiGhVBig"`
	HashSk    string `json:"-" dynamodbav:"hashGsiSk"`

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
			Time:             utils.GetDateAndTime(),
		})
	}

	return &crumbs
}

func (c *Crumb) ApplyPrefixes() {
	smallCell, err := h3.LatLngToCell(h3.LatLng{
		Lat: c.Lat,
		Lng: c.Lon,
	}, constants.MAP_ZOOM_SMALL)

	if err != nil {
		log.Fatalf("Failed to convert lat lng to cell. ERROR: %v", err)
	}

	midCell, err := h3.LatLngToCell(h3.LatLng{
		Lat: c.Lat,
		Lng: c.Lon,
	}, constants.MAP_ZOOM_MID)

	if err != nil {
		log.Fatalf("Failed to convert lat lng to cell. ERROR: %v", err)
	}

	bigCell, err := h3.LatLngToCell(h3.LatLng{
		Lat: c.Lat,
		Lng: c.Lon,
	}, constants.MAP_ZOOM_BIG)

	if err != nil {
		log.Fatalf("Failed to convert lat lng to cell. ERROR: %v", err)
	}

	vBigCell, err := h3.LatLngToCell(h3.LatLng{
		Lat: c.Lat,
		Lng: c.Lon,
	}, constants.MAP_ZOOM_VBIG)

	if err != nil {
		log.Fatalf("Failed to convert lat lng to cell. ERROR: %v", err)
	}

	c.PK = CrumbPkPrefix + c.Receiver
	c.SK = CrumbSkPrefix + c.SenderId + CrumbIdPrefix + c.Id

	c.HashSmall = CrumbPkPrefix + c.Receiver + "#" + CrumbHashSmallPrefix + smallCell.String()
	c.HashMid = CrumbPkPrefix + c.Receiver + "#" + CrumbHashMidPrefix + midCell.String()
	c.HashBig = CrumbPkPrefix + c.Receiver + "#" + CrumbHashBigPrefix + bigCell.String()
	c.HashVBig = CrumbPkPrefix + c.Receiver + "#" + CrumbHashVBigPrefix + vBigCell.String()
	c.HashSk = CrumbSkPrefix + c.SenderId + "#" + c.Id

	c.Time = CrumbTimePrefix + utils.GetDateAndTime()
}

func (c *Crumb) RemovePrefixes() {
	c.PK = c.Receiver
	c.SK = c.SenderId

	c.HashSmall = strings.ReplaceAll(c.HashSmall, CrumbPkPrefix+c.Receiver+"#"+CrumbHashSmallPrefix, "")
	c.HashMid = strings.ReplaceAll(c.HashMid, CrumbPkPrefix+c.Receiver+"#"+CrumbHashMidPrefix, "")
	c.HashBig = strings.ReplaceAll(c.HashBig, CrumbPkPrefix+c.Receiver+"#"+CrumbHashBigPrefix, "")
	c.HashVBig = strings.ReplaceAll(c.HashVBig, CrumbPkPrefix+c.Receiver+"#"+CrumbHashVBigPrefix, "")
	c.HashSk = c.SenderId

	c.Time = strings.ReplaceAll(c.Time, CrumbTimePrefix, "")
}

// converts a slice of database items to a slice of crumbs (maybe)
func ConvertToCrumbs(items []map[string]types.AttributeValue) *[]Crumb {
	return utils.DatabaseItemsToStructs(items, func(c *Crumb) {
		c.RemovePrefixes()
	})
}
