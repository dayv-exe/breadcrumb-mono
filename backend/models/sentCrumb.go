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
	SentCrumbPkPrefix = "SENT_CRUMB#"
	SentCrumbSkPrefix = "RECEIVER#"
)

type SentCrumb struct {
	Crumb
}

// Returns a slice of sent crumb models one for each receiver
func (s *CrumbBody) GetSentCrumbModels(crumbId, userId string) *[]SentCrumb {
	crumbs := make([]SentCrumb, 0)
	for _, receiver := range s.Receivers {
		crumbs = append(crumbs, SentCrumb{
			Crumb{
				Id:               crumbId,
				SenderId:         userId,
				Receiver:         receiver,
				Lat:              s.Lat,
				Lon:              s.Lon,
				LocationAccuracy: s.LocationAccuracy,
				LocationType:     s.LocationType,
				Text:             s.Text,
				Media:            s.MediaKeys,
				Time:             utils.GetDateAndTime(),
			},
		})
	}

	return &crumbs
}

func (c *SentCrumb) ApplyPrefixes() {
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

	c.PK = SentCrumbPkPrefix + c.SenderId
	c.SK = SentCrumbSkPrefix + c.Receiver + CrumbIdPrefix + c.Id

	c.HashSmall = SentCrumbPkPrefix + c.SenderId + "#" + CrumbHashSmallPrefix + smallCell.String()
	c.HashMid = SentCrumbPkPrefix + c.SenderId + "#" + CrumbHashMidPrefix + midCell.String()
	c.HashBig = SentCrumbPkPrefix + c.SenderId + "#" + CrumbHashBigPrefix + bigCell.String()
	c.HashVBig = SentCrumbPkPrefix + c.SenderId + "#" + CrumbHashVBigPrefix + vBigCell.String()
	c.HashSk = SentCrumbSkPrefix + c.Receiver + "#" + c.Id

	c.Time = CrumbTimePrefix + utils.GetDateAndTime()
	// IF THERE IS AN ERROR WE SHOULD MARK MEDIA FOR DELETION
}

func (c *SentCrumb) RemovePrefixes() {
	c.PK = c.SenderId
	c.SK = c.Receiver

	c.HashSmall = strings.ReplaceAll(c.HashSmall, SentCrumbPkPrefix+c.SenderId+"#"+CrumbHashSmallPrefix, "")
	c.HashMid = strings.ReplaceAll(c.HashMid, SentCrumbPkPrefix+c.SenderId+"#"+CrumbHashMidPrefix, "")
	c.HashBig = strings.ReplaceAll(c.HashBig, SentCrumbPkPrefix+c.SenderId+"#"+CrumbHashBigPrefix, "")
	c.HashVBig = strings.ReplaceAll(c.HashVBig, SentCrumbPkPrefix+c.SenderId+"#"+CrumbHashVBigPrefix, "")
	c.HashSk = c.Receiver

	c.Time = strings.ReplaceAll(c.Time, CrumbTimePrefix, "")
}

func ConvertToSentCrumbs(items []map[string]types.AttributeValue) *[]SentCrumb {
	return utils.DatabaseItemsToStructs(items, func(sc *SentCrumb) {
		sc.RemovePrefixes()
	})
}
