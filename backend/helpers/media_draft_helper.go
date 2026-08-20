package helpers

import (
	"backend/models"
	"backend/utils"
	"context"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type MediaDraftHelper struct {
	Ctx context.Context
}

func NewMediaDraftHelper(ctx context.Context) *MediaDraftHelper {
	return &MediaDraftHelper{
		Ctx: ctx,
	}
}

func (m *MediaDraftHelper) CreateNewDraft(userid, mediaKey string) error {
	// add new draft entry to db
	draft := models.NewMediaDraft(userid, mediaKey)
	helper := newHelper(m.Ctx, nil)
	return PutItem(helper, &draft)
}

func (m *MediaDraftHelper) SaveDrafts(userid string, mediaKeys []string) error {
	transactions := make([]types.TransactWriteItem, 0)

	for _, mediaKey := range mediaKeys {
		key := models.GetMediaDraftKey(userid, mediaKey)
		transactions = append(transactions, UseDelete(key, utils.GetDependencies().MainTableName))
	}

	helper := newHelper(m.Ctx, nil)
	return TransactWrite(
		helper,
		transactions...,
	)
}
