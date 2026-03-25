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
	ViewedCrumbPkPrefix = "VIEWED_CRUMB#"
	ViewedCrumbSkPrefix = "SENDER#"
)

type ViewedCrumb struct {
	Crumb
}

// Returns a slice of viewed crumb models one for each receiver
func (s *CrumbBody) GetViewedCrumbModels(crumbId, userId string) *[]ViewedCrumb {
	crumbs := make([]ViewedCrumb, 0)
	for _, receiver := range s.Receivers {
		crumbs = append(crumbs, ViewedCrumb{
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

func (c *ViewedCrumb) ApplyPrefixes() {
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

	c.PK = ViewedCrumbPkPrefix + c.Receiver
	c.SK = ViewedCrumbSkPrefix + c.SenderId + CrumbIdPrefix + c.Id

	c.HashSmall = ViewedCrumbPkPrefix + c.Receiver + "#" + CrumbHashSmallPrefix + smallCell.String()
	c.HashMid = ViewedCrumbPkPrefix + c.Receiver + "#" + CrumbHashMidPrefix + midCell.String()
	c.HashBig = ViewedCrumbPkPrefix + c.Receiver + "#" + CrumbHashBigPrefix + bigCell.String()
	c.HashVBig = ViewedCrumbPkPrefix + c.Receiver + "#" + CrumbHashVBigPrefix + vBigCell.String()
	c.HashSk = ViewedCrumbSkPrefix + c.SenderId + "#" + c.Id

	c.Time = CrumbTimePrefix + utils.GetDateAndTime()
	// IF THERE IS AN ERROR WE SHOULD MARK MEDIA FOR DELETION
}

func (c *ViewedCrumb) RemovePrefixes() {
	c.PK = c.SenderId
	c.SK = c.Receiver

	c.HashSmall = strings.ReplaceAll(c.HashSmall, ViewedCrumbPkPrefix+c.Receiver+"#"+CrumbHashSmallPrefix, "")
	c.HashMid = strings.ReplaceAll(c.HashMid, ViewedCrumbPkPrefix+c.Receiver+"#"+CrumbHashMidPrefix, "")
	c.HashBig = strings.ReplaceAll(c.HashBig, ViewedCrumbPkPrefix+c.Receiver+"#"+CrumbHashBigPrefix, "")
	c.HashVBig = strings.ReplaceAll(c.HashVBig, ViewedCrumbPkPrefix+c.Receiver+"#"+CrumbHashVBigPrefix, "")
	c.HashSk = c.SenderId

	c.Time = strings.ReplaceAll(c.Time, CrumbTimePrefix, "")
}

func ConvertToViewedCrumbs(items []map[string]types.AttributeValue) *[]ViewedCrumb {
	return utils.DatabaseItemsToStructs(items, func(sc *ViewedCrumb) {
		sc.RemovePrefixes()
	})
}
