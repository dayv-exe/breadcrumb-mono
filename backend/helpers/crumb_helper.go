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

func (h *crumbHelper) GetCrumb(userId, crumbId string, sentCrumb bool) (*models.Crumb, error) {
	helper := newHelper(h.Ctx, nil)
	switch sentCrumb {
	case false:
		// get crumb received by id
		result, err := getItem(
			helper,
			models.CrumbKey(userId, crumbId),
		)

		if err != nil {
			return nil, err
		}

		return &(*models.ConvertToCrumbs([]map[string]types.AttributeValue{result.Item}))[0], nil

	default:
		// get sent crumb by id
		keyCond := expression.KeyEqual(
			expression.Key("pk"),
			expression.Value(models.CrumbSenderPrefix+userId),
		).And(
			expression.KeyBeginsWith(
				expression.Key("sk"),
				models.CrumbIdPrefix+crumbId,
			),
		)

		expr, err := expression.NewBuilder().WithKeyCondition(keyCond).Build()
		if err != nil {
			return nil, err
		}

		result, err := QueryItems(
			helper,
			nil,
			aws.String("GSIndex"),
			expr,
			aws.Int32(1),
			func(c []map[string]types.AttributeValue) []models.Crumb {
				return *models.ConvertToCrumbs(c)
			},
		)

		if err != nil {
			return nil, err
		}

		return &result.Items[0], nil
	}
}

func (h *crumbHelper) GetCrumbs(userId string, sentCrumb bool, lastEvalKey map[string]types.AttributeValue) (*queryResult[models.Crumb], error) {
	pk := "gsi2"
	sk := "gsi2Sk"
	if sentCrumb {
		pk = "gsi3"
		sk = "gsi3Sk"
	}

	pkVal := models.CrumbReceiverPrefix + userId
	skVal := models.CrumbTimePrefix
	if sentCrumb {
		pkVal = models.CrumbSenderPrefix + userId
	}

	keyCond := expression.KeyEqual(
		expression.Key(pk),
		expression.Value(pkVal),
	).And(
		expression.KeyBeginsWith(
			expression.Key(sk),
			skVal,
		),
	)

	proj := expression.NamesList(
		expression.Name("id"),
		expression.Name("lat"),
		expression.Name("lon"),
		expression.Name("receiver"),
		expression.Name("sender"),
		expression.Name("time"),
		expression.Name("opened"),
	)

	indexName := "GSIndex2"
	if sentCrumb {
		indexName = "GSIndex3"
	}

	expr, err := expression.NewBuilder().WithKeyCondition(keyCond).WithProjection(proj).Build()
	if err != nil {
		return nil, err
	}

	return QueryItems(
		newHelper(h.Ctx, nil),
		&lastEvalKey,
		&indexName,
		expr,
		nil,
		func(c []map[string]types.AttributeValue) []models.Crumb {
			return *models.ConvertToCrumbs(c)
		},
	)
}
