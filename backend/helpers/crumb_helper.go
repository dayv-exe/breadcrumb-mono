package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
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

// get all unopened crumbs sent to current user. leave sender id blank to get from all senders or provide sender id to only get from given sender
func (h *crumbHelper) GetCrumbs(userId string, opened bool, lastKey *map[string]types.AttributeValue, limit *int32) ([]models.Crumb, map[string]types.AttributeValue, error) {
	pk := models.UnopenedCrumbPkPrefix + userId
	if opened {
		pk = models.OpenedCrumbPkPrefix + userId
	}

	helper := newHelper(h.Ctx, &utils.GetDependencies().MainTableName)
	keyCondition := expression.KeyEqual(
		expression.Key("pk"),
		expression.Value(pk),
	).And(
		expression.KeyBeginsWith(
			expression.Key("sk"),
			models.CrumbGeohashPrefix,
		),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(keyCondition).Build()
	if err != nil {
		return nil, nil, err
	}

	response, err := QueryItems(
		helper,
		lastKey,
		nil,
		expr,
		limit,
		func(c []map[string]types.AttributeValue) []models.Crumb {
			return *models.ConvertToCrumbs(c)
		})

	if err != nil {
		return nil, nil, err
	}

	return response.Items, response.LastEvaluatedKey, nil
}

// get all crumbs sent by current user. leave recipient id blank to get from all recipients or provide recipient id to only get sent to specific user
func (h *crumbHelper) GetSentCrumbs(userId string, lastKey *map[string]types.AttributeValue, limit *int32) ([]models.Crumb, map[string]types.AttributeValue, error) {
	keyCond := expression.KeyEqual(
		expression.Key("gsi2"),
		expression.Value(models.CrumbSenderPrefix+userId),
	).And(
		expression.KeyBeginsWith(
			expression.Key("gsi2Sk"),
			models.CrumbGeohashPrefix,
		),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(keyCond).Build()
	if err != nil {
		return nil, nil, err
	}

	helper := newHelper(h.Ctx, &utils.GetDependencies().MainTableName)
	result, err := QueryItems(helper, lastKey, aws.String("GSIndex2"), expr, limit, func(c []map[string]types.AttributeValue) []models.Crumb {
		return *models.ConvertToCrumbs(c)
	})

	if err != nil {
		return nil, nil, err
	}

	return result.Items, result.LastEvaluatedKey, err
}
