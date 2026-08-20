package models

import (
	"backend/utils"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// store info on a media file that was preemptively uploaded but the user hasnt shared the crumb yet.

const (
	MediaDraftPkPrefix = "DRAFT_OWNER#"
	MediaDraftSkPrefix = "DRAFT_MEDIA_KEY#"
)

type MediaDraft struct {
	Userid    string `dynamodbav:"userid" json:"-"`
	MediaKey  string `dynamodbav:"mediaKey" json:"-"`
	TimeStamp string `dynamodbav:"timeStamp" json:"-"`

	PK string `dynamodbav:"pk" json:"-"`
	SK string `dynamodbav:"sk" json:"-"`
}

func (m *MediaDraft) NewMediaDraft(userid, mediaKey string) MediaDraft {
	time := utils.GetNormalDateAndTime()

	return MediaDraft{
		Userid:    userid,
		MediaKey:  mediaKey,
		TimeStamp: time,
	}
}

func (m *MediaDraft) ApplyPrefixes() {
	m.PK = MediaDraftPkPrefix + m.Userid
	m.SK = MediaDraftSkPrefix + m.MediaKey
}

func ConvertToMediaDraft(items *[]map[string]types.AttributeValue) *[]MediaDraft {
	return utils.DatabaseItemsToStructs[MediaDraft](*items, nil)
}
