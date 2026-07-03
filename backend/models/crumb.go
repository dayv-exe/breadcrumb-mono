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
	Sent                    bool         `json:"sent" dynamodbav:"-"`
	Private                 bool         `json:"private" dynamodbav:"-"`
	Saved                   bool         `json:"saved" dynamodbav:"-"`
	Unlocked                bool         `json:"unlocked" dynamodbav:"unlocked"`
	FormattedAddress        string       `json:"formattedAddress" dynamodbav:"formattedAddress"`
	PlaceName               string       `json:"placename" dynamodbav:"placename"`

	Time string `json:"time" dynamodbav:"time"`

	PK string `json:"-" dynamodbav:"pk"`
	SK string `json:"-" dynamodbav:"sk"`

	Gsi   string `json:"-" dynamodbav:"gsi"`
	GsiSk string `json:"-" dynamodbav:"gsiSk"`
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
	owner := c.Receiver
	otherUser := c.Sender

	if c.Sent {
		// if you sent this crumb
		owner = c.Sender
		otherUser = c.Receiver
	} else if c.Private {
		owner = c.Sender
		otherUser = c.Sender
	}

	// pk: CRUMB_OWNER#{userid} sk: TS#{timestamp}CRUMB_ID#{crumbId}OTHER_USER#{userid}
	c.PK = CrumbPkPrefix + owner
	c.SK = CrumbSkPrefix + c.Time + CrumbIdPrefix + c.Id + CrumbOtherUserPrefix + otherUser

	// to get crumb by id and other user
	c.Gsi = CrumbPkPrefix + owner
	c.GsiSk = CrumbIdPrefix + c.Id + CrumbOtherUserPrefix + otherUser
}

func IsValidMailbox(mailbox string) bool {
	mailbox = strings.ToLower(mailbox)
	return mailbox == constants.MAILBOX_SENT || mailbox == constants.MAILBOX_RECEIVED || mailbox == constants.MAILBOX_PRIVATE || mailbox == constants.MAILBOX_SAVED
}

func createCrumb(crumbBody *CrumbBody, otherUser, mailbox string) Crumb {
	if !IsValidMailbox(mailbox) {
		log.Fatalf("ERROR: invalid mailbox parsed!")
	}

	curUserid := utils.GetAuthenticatedUserid()
	time := utils.GetNormalDateAndTime()

	sender := curUserid
	receiver := otherUser

	if mailbox == "received" {
		sender = otherUser
		receiver = curUserid
	}
	return Crumb{
		Id:                      crumbBody.Id,
		Sender:                  sender,
		Receiver:                receiver,
		Latitude:                crumbBody.Latitude,
		Longitude:               crumbBody.Longitude,
		Radius:                  crumbBody.Radius,
		LocationSelectionManner: crumbBody.LocationSelectionManner,
		Text:                    crumbBody.Text,
		Media:                   crumbBody.MediaKeys,
		Sent:                    mailbox == constants.MAILBOX_SENT,
		Private:                 mailbox == constants.MAILBOX_PRIVATE,
		Saved:                   mailbox == constants.MAILBOX_SAVED,
		Unlocked:                mailbox == constants.MAILBOX_SAVED,
		FormattedAddress:        crumbBody.Address,
		Geohash:                 geohash.Encode(crumbBody.Latitude, crumbBody.Longitude),
		Time:                    time,
	}
}

func (c *Crumb) RemovePrefixes() {
}

func CreateSentCrumb(body *CrumbBody, receiverId string) Crumb {
	return createCrumb(body, receiverId, constants.MAILBOX_SENT)
}

func CreateReceivedCrumb(body *CrumbBody, senderId string) Crumb {
	return createCrumb(body, senderId, constants.MAILBOX_RECEIVED)
}

func CreatePrivateCrumb(body *CrumbBody, userid string) Crumb {
	return createCrumb(body, userid, constants.MAILBOX_PRIVATE)
}

func CreateSavedCrumb(body *CrumbBody, senderId string) Crumb {
	return createCrumb(body, senderId, constants.MAILBOX_SAVED)
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
