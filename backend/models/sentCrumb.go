package models

import (
	"backend/utils"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/mmcloughlin/geohash"
)

const (
	SentCrumbPkPrefix = "SENT_CRUMB#"
	SentCrumbSkPrefix = "RECEIVER#"
)

type SentCrumb struct {
	Crumb
}

// Returns a slice of sent crumb models one for each receiver
func (s *CrumbBody) GetSentCrumbModels(userId string) *[]SentCrumb {
	crumbs := make([]SentCrumb, 0)
	for _, receiver := range s.Receivers {
		crumbs = append(crumbs, SentCrumb{
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

func (c *SentCrumb) ApplyPrefixes() {
	c.PK = SentCrumbPkPrefix + c.SenderId
	c.SK = SentCrumbSkPrefix + c.Receiver + CrumbIdPrefix + c.Id
	c.Gsi = CrumbIdPrefix + c.Id

	c.HashPk = SentCrumbPkPrefix + c.SenderId + CrumbHashPrefix + c.Geohash[:2]
	c.HashSk = CrumbHashPrefix + c.Geohash + SentCrumbSkPrefix + c.Receiver + CrumbIdPrefix + c.Id

	c.Time = CrumbTimePrefix + utils.GetDateAndTime()
	// IF THERE IS AN ERROR WE SHOULD MARK MEDIA FOR DELETION
}

func (c *SentCrumb) RemovePrefixes() {
	c.Time = strings.ReplaceAll(c.Time, CrumbTimePrefix, "")
}

func ConvertToSentCrumbs(items []map[string]types.AttributeValue) *[]SentCrumb {
	return utils.DatabaseItemsToStructs(items, func(sc *SentCrumb) {
		sc.RemovePrefixes()
	})
}
