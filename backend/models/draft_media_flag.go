package models

import (
	"backend/utils"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// store info on a media file that was preemptively uploaded but the user hasnt shared the crumb yet.

const (
	MediaDraftPkPrefix      = "DRAFT_OWNER#"
	MediaDraftSkPrefix      = "DRAFT_MEDIA_KEY#"
	MediaDraftCrumbIdPrefix = "DRAFT_MEDIA_CRUMB_ID#"
)

type DraftMediaFlag struct {
	Userid    string `dynamodbav:"userid" json:"-"`
	MediaKey  string `dynamodbav:"mediaKey" json:"-"`
	TimeStamp string `dynamodbav:"timeStamp" json:"-"`

	PK string `dynamodbav:"pk" json:"-"`
	SK string `dynamodbav:"sk" json:"-"`
}

func NewDraftMediaFlag(userid, mediaKey string) *DraftMediaFlag {
	time := utils.GetNormalDateAndTime()

	return &DraftMediaFlag{
		Userid:    userid,
		MediaKey:  mediaKey,
		TimeStamp: time,
	}
}

func (m *DraftMediaFlag) ApplyPrefixes() {
	m.PK = MediaDraftPkPrefix + m.Userid
	m.SK = MediaDraftSkPrefix + m.MediaKey
}

func ConvertToMediaDraftFlags(items *[]map[string]types.AttributeValue) *[]DraftMediaFlag {
	return utils.DatabaseItemsToStructs[DraftMediaFlag](*items, nil)
}

func GetMediaDraftFlagKey(userid, mediaKey string) map[string]types.AttributeValue {
	return map[string]types.AttributeValue{
		"pk": &types.AttributeValueMemberS{Value: MediaDraftPkPrefix + userid},
		"sk": &types.AttributeValueMemberS{Value: MediaDraftSkPrefix + mediaKey},
	}
}
