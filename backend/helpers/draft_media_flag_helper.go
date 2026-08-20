package helpers

import (
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type DraftMediaFlagHelper struct {
	Ctx context.Context
}

func NewDraftMediaFlagHelper(ctx context.Context) *DraftMediaFlagHelper {
	return &DraftMediaFlagHelper{
		Ctx: ctx,
	}
}

func (m *DraftMediaFlagHelper) PutNewDraftMediaFlag(userid, mediaKey string) error {
	draftFlag := models.NewDraftMediaFlag(userid, mediaKey)
	return PutItem(newHelper(m.Ctx, nil), &draftFlag)
}

func (m *DraftMediaFlagHelper) RemoveDraftMediaFlags(userid string, mediaKeys []models.CrumbMedia) error {
	transactions := make([]types.TransactWriteItem, 0)
	tableName := utils.GetDependencies().MainTableName

	for _, mediaKey := range mediaKeys {
		key := models.GetMediaDraftFlagKey(userid, mediaKey.MediaKey)
		thumbnailKey := models.GetMediaDraftFlagKey(userid, mediaKey.ThumbnailKey)
		transactions = append(transactions,
			UseDelete(key, tableName),
			UseDelete(thumbnailKey, tableName),
		)
	}

	helper := newHelper(m.Ctx, nil)
	return TransactWrite(
		helper,
		transactions...,
	)
}
