package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type crumbHelper struct {
	Ctx context.Context
}

func NewCrumbHelper(ctx context.Context) *crumbHelper {
	return &crumbHelper{
		Ctx: ctx,
	}
}

func (h *crumbHelper) SendCrumb(userId string, crumb models.CrumbBody) error {
	if crumb.Id == "" {
		return fmt.Errorf("Crumb id cannot be empty")
	}

	if crumb.LocationType != constants.LOCATION_TYPE_MINE && crumb.LocationType != constants.LOCATION_TYPE_FRIEND && crumb.LocationType != constants.LOCATION_TYPE_GPS {
		return fmt.Errorf("Invalid crumb location type")
	}

	crumbs := crumb.GetCrumbs(userId)

	transactions := make([]types.TransactWriteItem, 0)

	for _, crumb := range *crumbs {
		// unread crumbs to be sent to recipient
		transactions = append(transactions, UsePut(&crumb, utils.GetDependencies().MainTableName, nil))
	}

	helper := newHelper(h.Ctx, nil)
	return TransactWrite(helper, transactions...)
}
