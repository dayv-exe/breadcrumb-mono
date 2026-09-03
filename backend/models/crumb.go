package models

import (
	"backend/constants"
	"backend/utils"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/mmcloughlin/geohash"
)

// get all crumbs sorted by timestamp
// get all crumbs in location (geohash)
// get crumb by id

const (
	// pk: CRUMB_OWNER#{userid} sk: TS#{timestamp}CRUMB_ID#{crumbId}OTHER_USER#{userid}
	CrumbPkPrefix        = "CRUMB_OWNER#"
	CrumbSkPrefix        = "TS#"
	CrumbIdPrefix        = "CRUMB_ID#"
	CrumbOtherUserPrefix = "OTHER_USER#"
)

type CrumbCaption struct {
	Index   int    `json:"index" dynamodbav:"index"`
	Content string `json:"content" dynamodbav:"content"`
}

type CrumbMedia struct {
	Index        int    `json:"index" dynamodbav:"index"`
	MediaKey     string `json:"media" dynamodbav:"media"`
	ThumbnailKey string `json:"thumbnail,omitempty" dynamodbav:"thumbnail"`
	Caption      string `json:"caption" dynamodbav:"caption"`
}

type CrumbBody struct {
	NonCompositeId          string       `json:"nonCompositeId"`
	Receivers               []string     `json:"receivers"`
	Latitude                float64      `json:"latitude"`
	Longitude               float64      `json:"longitude"`
	Radius                  float32      `json:"radius"`
	LocationSelectionManner string       `json:"locationSelectionManner"`
	MediaKeys               []CrumbMedia `json:"media"`
	ClickedFeatureId        string       `json:"clickedFeatureId"`
	Address                 string       `json:"address"`
}

type CrumbMarkerDetails struct {
	UserId                  string `json:"userid"`
	Nickname                string `json:"nickname"`
	ProfilePicture          string `json:"profilePicture"`
	ProfilePictureThumbnail string `json:"profilePictureThumbnail"`
}

type Crumb struct {
	Id                      string       `json:"id" dynamodbav:"id"`
	NonCompositeId          string       `json:"nonCompositeId" dynamodbav:"nonCompositeId"`
	Sender                  string       `json:"sender" dynamodbav:"sender"`
	Receiver                string       `json:"receiver" dynamodbav:"receiver"`
	Latitude                float64      `json:"latitude" dynamodbav:"latitude"`
	Longitude               float64      `json:"longitude" dynamodbav:"longitude"`
	Radius                  float32      `json:"radius" dynamodbav:"radius"`
	LocationSelectionManner string       `json:"locationSelectionManner" dynamodbav:"locationSelectionManner"`
	PlaceId                 string       `json:"placeId" dynamodbav:"placeId"`
	Media                   []CrumbMedia `json:"media" dynamodbav:"media"`
	Geohash                 string       `json:"geohash" dynamodbav:"geohash"`
	Saved                   bool         `json:"saved" dynamodbav:"-"`
	Unlocked                bool         `json:"unlocked" dynamodbav:"unlocked"`
	Opened                  bool         `json:"opened" dynamobdav:"opened"`
	FormattedAddress        string       `json:"formattedAddress" dynamodbav:"formattedAddress"`
	PlaceName               string       `json:"placename" dynamodbav:"placename"`
	NotificationMessage     string       `json:"notificationMessage" dynamodbav:"notificationMessage"`

	Time string `json:"time" dynamodbav:"time"`

	PK string `json:"-" dynamodbav:"pk"`
	SK string `json:"-" dynamodbav:"sk"`

	Gsi   string `json:"-" dynamodbav:"gsi"`
	GsiSk string `json:"-" dynamodbav:"gsiSk"`

	Gsi2   string `json:"-" dynamodbav:"gsi2"`
	Gsi2Sk string `json:"-" dynamodbav:"gsi2Sk"`

	Owner     string `json:"-" dynamodbav:"-"`
	OtherUser string `json:"-" dynamodbav:"-"`
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

func (c *Crumb) ApplyPrefixes() {
	// if you received/saved this crumb
	// you cannot save your private crumbs

	// pk: CRUMB_OWNER#{userid} sk: TS#{timestamp}CRUMB_ID#{crumbId}OTHER_USER#{userid}
	c.PK = CrumbPkPrefix + c.Owner
	c.SK = CrumbSkPrefix + c.Time + CrumbIdPrefix + c.Id + CrumbOtherUserPrefix + c.OtherUser

	// to get crumb by id from owners partition
	c.Gsi = CrumbPkPrefix + c.Owner
	c.GsiSk = CrumbIdPrefix + c.Id + CrumbOtherUserPrefix + c.OtherUser

	// to access crumb by non composite id only not to be expose to client apis
	c.Gsi2 = CrumbIdPrefix + c.NonCompositeId
	c.Gsi2Sk = CrumbPkPrefix + c.Owner + CrumbOtherUserPrefix + c.OtherUser
}

func IsValidMailbox(mailbox string) bool {
	mailbox = strings.ToLower(mailbox)
	return mailbox == constants.MAILBOX_SENT || mailbox == constants.MAILBOX_RECEIVED
}

func createCrumb(crumbBody *CrumbBody, owner, otherUser, sender, receiver, mailbox string, saved bool) Crumb {
	if !IsValidMailbox(mailbox) {
		log.Fatalf("ERROR: invalid mailbox parsed!")
	}
	time := utils.GetNormalDateAndTime()
	return Crumb{
		Id:                      crumbBody.NonCompositeId + owner + otherUser,
		NonCompositeId:          crumbBody.NonCompositeId,
		Sender:                  sender,
		Receiver:                receiver,
		Latitude:                crumbBody.Latitude,
		Longitude:               crumbBody.Longitude,
		Radius:                  crumbBody.Radius,
		LocationSelectionManner: crumbBody.LocationSelectionManner,
		Media:                   crumbBody.MediaKeys,
		Saved:                   saved,
		Unlocked:                saved,
		Opened:                  false,
		FormattedAddress:        crumbBody.Address,
		Geohash:                 geohash.Encode(crumbBody.Latitude, crumbBody.Longitude),
		Time:                    time,
		Owner:                   owner,
		OtherUser:               otherUser,
	}
}

func (c *Crumb) RemovePrefixes() {
}

func CreateSentCrumb(body *CrumbBody, sender, receiver string) Crumb {
	owner := sender
	otherUser := receiver
	return createCrumb(
		body,
		owner,
		otherUser,
		sender,
		receiver,
		constants.MAILBOX_SENT,
		false,
	)
}

func CreateReceivedCrumb(body *CrumbBody, sender, receiver string) Crumb {
	owner := receiver
	otherUser := sender
	return createCrumb(
		body,
		owner,
		otherUser,
		sender,
		receiver,
		constants.MAILBOX_RECEIVED,
		false,
	)
}

func CreateSavedCrumb(body *CrumbBody, owner, otherUser, sender, receiver string) Crumb {
	return createCrumb(
		body,
		owner,
		otherUser,
		sender,
		receiver,
		constants.MAILBOX_RECEIVED,
		true,
	)
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
