package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type crumbHelper struct {
	Ctx context.Context
}

func resolveCrumbMailbox(c *models.Crumb, userid string) {
	c.Sent = c.Sender == userid
	c.Private = c.Sender == c.Receiver
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

	if crumb.LocationSelectionManner != constants.LOCATION_TYPE_MINE && crumb.LocationSelectionManner != constants.LOCATION_TYPE_NONE && crumb.LocationSelectionManner != constants.LOCATION_TYPE_LABEL && crumb.LocationSelectionManner != constants.LOCATION_TYPE_DROPPED_PIN {
		return fmt.Errorf("Invalid crumb location type")
	}

	crumbs := crumb.GetCrumbs(userId)

	transactions := make([]types.TransactWriteItem, 0)

	mapboxHelper := NewMapboxHelper(h.Ctx)

	placeIds := make([]string, 0)
	placeName := ""
	formattedAddress, err := mapboxHelper.GetFormattedAddress(crumb.Latitude, crumb.Longitude)
	if err != nil {
		log.Printf("FAILED TO GET FORMATTED ADDRESS. ERROR: %v", err)
		return err
	}

	if crumb.LocationSelectionManner != constants.LOCATION_TYPE_DROPPED_PIN {
		placesInfo, err := mapboxHelper.GetNearbyPlaceIds(crumb.Latitude, crumb.Longitude, float64(crumb.Radius), crumb.LocationSelectionManner, crumb.ClickedFeatureId)
		if err != nil {
			return fmt.Errorf("Failed to send crumb. ERROR: %v", err)
		}

		placeName = placesInfo.placeName
		placeIds = append(placeIds, placesInfo.placeIds...)
	}

	for _, crumb := range *crumbs {
		// unread crumbs to be sent to recipient
		crumb.PlaceId = strings.Join(placeIds, ",")
		crumb.FormattedAddress = formattedAddress
		crumb.PlaceName = placeName
		transactions = append(transactions, UsePut(&crumb, utils.GetDependencies().MainTableName, nil))
	}

	helper := newHelper(h.Ctx, nil)
	return TransactWrite(helper, transactions...)
}

func (h *crumbHelper) GetCrumb(userId, crumbId string, sentCrumb bool) (*models.Crumb, error) {
	helper := newHelper(h.Ctx, nil)
	switch sentCrumb {
	case false:
		return GetAndConvertItem(
			helper,
			*models.CrumbKey(userId, crumbId),
			nil,
			func(item map[string]types.AttributeValue) models.Crumb {
				crumb := utils.DatabaseItemToStruct(item, func(c *models.Crumb) {
					c.Sent = c.Sender == userId
					c.RemovePrefixes()
				})

				return *crumb
			},
		)
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
				return *models.ConvertToCrumbs(c, func(c *models.Crumb) {
					resolveCrumbMailbox(c, userId)
				})
			},
		)

		if err != nil {
			return nil, err
		}

		return &result.Items[0], nil
	}
}

func (h *crumbHelper) OpenCrumb(userId, crumbId string, sentCrumb bool) ([]resItem, error) {
	// based on location manner, do a check to see if user can open crumb
	return h.getCrumbContent(userId, crumbId, sentCrumb)
}

var defaultCrumbProjection = expression.NamesList(
	expression.Name("id"),
	expression.Name("latitude"),
	expression.Name("longitude"),
	expression.Name("receiver"),
	expression.Name("sender"),
	expression.Name("time"),
	expression.Name("opened"),
	expression.Name("placeId"),
	expression.Name("locationSelectionManner"),
	expression.Name("radius"),
	expression.Name("formattedAddress"),
	expression.Name("placename"),
)

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

	proj := defaultCrumbProjection

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
			crumbs := utils.DatabaseItemsToStructs(c, func(c *models.Crumb) {
				c.Sent = userId == c.Sender
				c.RemovePrefixes()
			})
			return *crumbs
		},
	)
}

func (h *crumbHelper) GetLatestCrumbs(mailbox, crumbId, receiverId, timestamp string) (*queryResult[models.Crumb], error) {
	userid := utils.GetAuthenticatedUserid()
	pkName := "pk"
	skName := "sk"
	indexName := "GSIndex2"
	gsiName := "gsi2"
	gsiSkName := "gsi2Sk"
	pk := models.CrumbPkPrefix + userid
	sk := models.CrumbIdPrefix + crumbId
	gsi := models.CrumbReceiverPrefix + userid
	gsiSk := models.CrumbTimePrefix + timestamp + models.CrumbIdPrefix + crumbId

	if mailbox == "sent" {
		indexName = "GSIndex3"
		gsiName = "gsi3"
		gsiSkName = "gsi3Sk"
		pk = models.CrumbPkPrefix + receiverId
		sk = models.CrumbIdPrefix + crumbId
		gsi = models.CrumbSenderPrefix + userid
		gsiSk = models.CrumbTimePrefix + timestamp + models.CrumbIdPrefix + crumbId
		log.Printf("MAILBOX SHOULD BE: sent mailbox is: %v", mailbox)
	} else if mailbox == "private" {
		indexName = "GSIndex3"
		gsiName = "gsi3"
		gsiSkName = "gsi3Sk"
		pk = models.PrivateCrumbReceiverPrefix + userid
		sk = models.CrumbIdPrefix + crumbId
		gsi = models.PrivateCrumbReceiverPrefix + userid
		gsiSk = models.CrumbTimePrefix + timestamp + models.CrumbIdPrefix + crumbId
		log.Printf("MAILBOX SHOULD BE: private mailbox is: %v", mailbox)
	}

	var lastKey *map[string]types.AttributeValue = &map[string]types.AttributeValue{
		pkName:    &types.AttributeValueMemberS{Value: pk},
		skName:    &types.AttributeValueMemberS{Value: sk},
		gsiName:   &types.AttributeValueMemberS{Value: gsi},
		gsiSkName: &types.AttributeValueMemberS{Value: gsiSk},
	}

	if crumbId == "" || timestamp == "" {
		lastKey = nil
	}

	keyCond := expression.KeyEqual(
		expression.Key(gsiName),
		expression.Value(gsi),
	)

	projection := defaultCrumbProjection

	expr, err := expression.NewBuilder().WithKeyCondition(keyCond).WithProjection(projection).Build()
	if err != nil {
		return nil, err
	}

	return QueryItems(
		newHelper(h.Ctx, nil),
		lastKey,
		&indexName,
		expr,
		nil,
		func(c []map[string]types.AttributeValue) []models.Crumb {
			return *models.ConvertToCrumbs(c, func(c *models.Crumb) {
				resolveCrumbMailbox(c, userid)
			})
		},
	)
}

func (h *crumbHelper) GetPrivateCrumbs(lastEvalKey map[string]types.AttributeValue) (*queryResult[models.Crumb], error) {
	userid := utils.GetAuthenticatedUserid()
	keyCond := expression.KeyEqual(
		expression.Key("gsi2"),
		expression.Value(models.PrivateCrumbReceiverPrefix+userid),
	).And(
		expression.KeyBeginsWith(
			expression.Key("gsi2Sk"),
			models.CrumbTimePrefix,
		),
	)

	proj := defaultCrumbProjection

	expr, err := expression.NewBuilder().WithKeyCondition(keyCond).WithProjection(proj).Build()
	if err != nil {
		return nil, err
	}

	return QueryItems(
		newHelper(h.Ctx, nil),
		&lastEvalKey,
		aws.String("GSIndex2"),
		expr,
		nil,
		func(c []map[string]types.AttributeValue) []models.Crumb {
			return *models.ConvertToCrumbs(c, func(c *models.Crumb) {
				resolveCrumbMailbox(c, userid)
			})
		},
	)
}

type resItem struct {
	Index     int              `json:"index"`
	Media     string           `json:"media"`
	Overlay   string           `json:"overlay"`
	Thumbnail string           `json:"thumbnail"`
	Text      models.CrumbText `json:"text,omitempty"`
}

func (h *crumbHelper) getCrumbContent(userId, crumbId string, sentCrumb bool) ([]resItem, error) {
	key := models.CrumbKey(userId, crumbId)
	helper := newHelper(h.Ctx, nil)
	var crumb models.Crumb

	switch sentCrumb {
	case true:
		// sender wants to view crumb
		keyCond := expression.KeyEqual(
			expression.Key("gsi"),
			expression.Value(models.CrumbSenderPrefix+userId),
		).And(
			expression.KeyEqual(
				expression.Key("gsiSk"),
				expression.Value(models.CrumbIdPrefix+crumbId),
			),
		)

		proj := expression.NamesList(
			expression.Name("text"),
			expression.Name("media"),
		)

		expr, err := expression.NewBuilder().WithKeyCondition(keyCond).WithProjection(proj).Build()

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
				return *models.ConvertToCrumbs(c, func(c *models.Crumb) {
					resolveCrumbMailbox(c, userId)
				})
			},
		)

		if err != nil {
			return nil, err
		}

		if len(result.Items) < 1 {
			return nil, fmt.Errorf("No such crumb exists!")
		}

		crumb = result.Items[0]
	default:
		// receiver wants to view crumb
		expr, err := expression.NewBuilder().WithProjection(
			expression.NamesList(
				expression.Name("media"),
				expression.Name("text"),
			),
		).Build()
		if err != nil {
			return nil, err
		}

		result, err := GetAndConvertItem(
			helper,
			*key,
			&expr,
			func(m map[string]types.AttributeValue) models.Crumb {
				return (*models.ConvertToCrumbs([]map[string]types.AttributeValue{m}, func(c *models.Crumb) {
					resolveCrumbMailbox(c, userId)
				}))[0]
			},
		)

		if err != nil {
			return nil, err
		}

		crumb = *result
	}

	res := make([]resItem, len(crumb.Media)+len(crumb.Text))
	cloudfrontHelper := NewCloudfrontHelper(h.Ctx)

	for _, media := range crumb.Media {
		mediaKey, _, _ := cloudfrontHelper.GetSignedUrl(media.MediaKey, constants.CRUMB_MEDIA_URL_TTL)
		thumbnailKey, _, _ := cloudfrontHelper.GetSignedUrl(media.ThumbnailKey, constants.CRUMB_MEDIA_URL_TTL)
		overlayKey, _, _ := cloudfrontHelper.GetSignedUrl(media.OverlayKey, constants.CRUMB_MEDIA_URL_TTL)

		res[media.Index] = resItem{
			Index:     media.Index,
			Media:     mediaKey,
			Overlay:   overlayKey,
			Thumbnail: thumbnailKey,
		}
	}

	for _, text := range crumb.Text {
		res[text.Index] = resItem{
			Index: text.Index,
			Text: models.CrumbText{
				Index:   text.Index,
				Content: text.Content,
			},
		}
	}

	return res, nil
}
