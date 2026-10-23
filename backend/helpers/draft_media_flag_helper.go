package helpers

import (
	"backend/models"
	"backend/utils"
	"context"
	"errors"
	"strings"

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
	tableName := utils.GetDependencies().MainTableName
	transactions := make([]types.TransactWriteItem, 0)
	seen := make(map[string]struct{}, 0)

	add := func(key string) {
		if strings.TrimSpace(key) == "" {
			return
		}
		if _, exists := seen[key]; exists {
			return
		}

		t := UseDelete(models.GetMediaDraftFlagKey(userid, key), tableName)
		transactions = append(transactions, t)
		seen[key] = struct{}{}
	}

	for _, key := range mediaKeys {
		add(key.MediaKey)
		add(key.ThumbnailKey)
	}

	if len(transactions) == 0 {
		return nil
	}

	return TransactWrite(newHelper(m.Ctx, nil), transactions...)
}

// removes draft flag and media from bucket
func (m *DraftMediaFlagHelper) DeleteDraftMedia(userid string, storageKeys []string) error {
	helper := newHelper(m.Ctx, nil)
	errs := make([]error, 0)
	for _, sKey := range storageKeys {
		key := models.GetMediaDraftFlagKey(userid, sKey)
		if err := DeleteItem(helper, &key); err != nil {
			errs = append(errs, err)
		}

		if err := NewS3Helper(m.Ctx).DeleteObj(sKey); err != nil {
			errs = append(errs, err)
		}
	}

	return errors.Join(errs...)
}
