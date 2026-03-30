package models

import (
	"backend/utils"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/mmcloughlin/geohash"
)

const (
	ViewedCrumbPkPrefix = "VIEWED_CRUMB#"
	ViewedCrumbSkPrefix = "SENDER#"
)

type ViewedCrumb struct {
	Crumb
}

// Returns a slice of viewed crumb models one for each receiver
func (s *CrumbBody) GetViewedCrumbModels(userId string) *[]ViewedCrumb {
	crumbs := make([]ViewedCrumb, 0)
	for _, receiver := range s.Receivers {
		crumbs = append(crumbs, ViewedCrumb{
			Crumb{
				Id:               s.Id,
				SenderId:         userId,
				Receiver:         receiver,
				Lat:              s.Lat,
				Lon:              s.Lon,
				LocationAccuracy: s.LocationAccuracy,
				LocationType:     s.LocationType,
				Text:             s.Text,
				Media:            s.MediaKeys,
				Geohash:          geohash.Encode(s.Lat, s.Lon),
				Time:             utils.GetDateAndTime(),
			},
		})
	}

	return &crumbs
}

func (c *ViewedCrumb) ApplyPrefixes() {
	c.PK = ViewedCrumbPkPrefix + c.Receiver
	c.SK = ViewedCrumbSkPrefix + c.SenderId + CrumbIdPrefix + c.Id
	c.Gsi = CrumbIdPrefix + c.Id

	c.HashPk = ViewedCrumbPkPrefix + c.Receiver + CrumbHashPrefix + c.Geohash[:2]
	c.HashSk = CrumbHashPrefix + c.Geohash + ViewedCrumbSkPrefix + c.SenderId + CrumbIdPrefix + c.Id

	c.Time = CrumbTimePrefix + utils.GetDateAndTime()
	// IF THERE IS AN ERROR WE SHOULD MARK MEDIA FOR DELETION
}

func (c *ViewedCrumb) RemovePrefixes() {
	log.Printf("time: %v", c.Time)
	c.Time = strings.ReplaceAll(c.Time, CrumbTimePrefix, "")
}

func ConvertToViewedCrumbs(items []map[string]types.AttributeValue) *[]ViewedCrumb {
	return utils.DatabaseItemsToStructs(items, func(sc *ViewedCrumb) {
		sc.RemovePrefixes()
	})
}
