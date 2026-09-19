package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"fmt"
	"log"
	"strings"
	"sync"

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

func (h *crumbHelper) ShareCrumb(userId string, crumb models.CrumbBody) error {
	if crumb.NonCompositeId == "" {
		return fmt.Errorf("Crumb id cannot be empty")
	}

	if crumb.LocationSelectionManner != constants.LOCATION_TYPE_MINE && crumb.LocationSelectionManner != constants.LOCATION_TYPE_NONE && crumb.LocationSelectionManner != constants.LOCATION_TYPE_LABEL && crumb.LocationSelectionManner != constants.LOCATION_TYPE_DROPPED_PIN {
		return fmt.Errorf("Invalid crumb location type")
	}

	crumbs := make([]*models.Crumb, 0)

	for _, receiver := range crumb.Receivers {
		// check that receiver has not blocked sender here
		// bi-directional crumbs one for sender one for receiver
		receiversCopy := models.CreateReceivedCrumb(&crumb, userId, receiver)
		crumbs = append(crumbs, &receiversCopy)
		if userId != receiver {
			// if not private crumb
			sendersCopy := models.CreateSentCrumb(&crumb, userId, receiver)
			crumbs = append(crumbs, &sendersCopy)
		}
	}

	transactions := make([]types.TransactWriteItem, 0)

	mapboxHelper := NewMapboxHelper(h.Ctx)

	placeIds := make([]string, 0)
	placeName := ""
	formattedAddress := crumb.Address
	var err error = nil
	if strings.TrimSpace(formattedAddress) == "" {
		formattedAddress, err = mapboxHelper.GetFormattedAddress(crumb.Latitude, crumb.Longitude)
	}
	if err != nil {
		log.Printf("FAILED TO GET FORMATTED ADDRESS. ERROR: %v", err)
		return err
	}

	if crumb.LocationSelectionManner != constants.LOCATION_TYPE_DROPPED_PIN {
		placesInfo, err := mapboxHelper.GetNearbyPlaceIds(crumb.Latitude, crumb.Longitude, float64(crumb.Radius), crumb.LocationSelectionManner, crumb.ClickedFeatureId)
		if err != nil {
			return fmt.Errorf("Failed to send crumb. ERROR: %v", err)
		}

		placeName = placesInfo.PlaceName
		placeIds = append(placeIds, placesInfo.PlaceIds...)
	}

	for _, crumb := range crumbs {
		// unread crumbs to be sent to recipient
		crumb.PlaceId = strings.Join(placeIds, ",")
		crumb.FormattedAddress = formattedAddress
		crumb.PlaceName = placeName
		transactions = append(transactions, UsePut(crumb, utils.GetDependencies().MainTableName, nil))
	}

	helper := newHelper(h.Ctx, nil)
	err = TransactWrite(helper, transactions...)
	if err != nil {
		return err
	}

	liveEventHelper := NewLiveEventHelper(h.Ctx)
	var wg sync.WaitGroup
	for _, crumb := range crumbs {
		wg.Go(func() {
			err := liveEventHelper.PublishEvents(
				constants.LIVE_EVENT_CHANNEL_CRUMB+crumb.Owner,
				LiveEvent{
					EventType: "crumb",
					Payload:   crumb,
				},
			)

			if err != nil {
				log.Printf("Crumb shared but failed to send live event! ERROR: %w", err)
			}
		})
	}

	wg.Wait()

	return nil
}

func (h *crumbHelper) GetCrumb(otherUser, crumbId string) (*models.Crumb, error) {
	userid := utils.GetAuthenticatedUserid()
	helper := newHelper(h.Ctx, nil)
	keyCond := expression.KeyEqual(
		expression.Key("gsi"),
		expression.Value(models.CrumbPkPrefix+userid),
	).And(
		expression.KeyEqual(
			expression.Key("gsiSk"),
			expression.Value(models.CrumbIdPrefix+crumbId+models.CrumbOtherUserPrefix+otherUser),
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
		nil,
		aws.Int32(1),
		func(c []map[string]types.AttributeValue) []models.Crumb {
			return *models.ConvertToCrumbs(c, func(c *models.Crumb) {
			})
		},
	)

	if err != nil {
		return nil, err
	}

	return &result.Items[0], nil
}

func (h *crumbHelper) CrumbExists(ownerId, crumbNonCompositeId string) (bool, error) {
	keyCondition := expression.KeyEqual(expression.Key("gsi2"), expression.Value(
		models.CrumbIdPrefix+crumbNonCompositeId,
	)).And(
		expression.KeyBeginsWith(expression.Key("gsi2Sk"), models.CrumbPkPrefix+ownerId),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(keyCondition).Build()
	if err != nil {
		log.Printf("ERROR: Failed to build expression")
		return false, err
	}

	result, err := QueryItems(
		newHelper(h.Ctx, nil),
		nil,
		aws.String("GSIndex2"),
		expr,
		nil,
		aws.Int32(1),
		func(item []map[string]types.AttributeValue) []models.Crumb {
			return *models.ConvertToCrumbs(item, nil)
		},
	)

	if err != nil {
		return false, err
	}

	return len(result.Items) > 0, nil
}

var defaultCrumbProjection = expression.NamesList(
	expression.Name("id"),
	expression.Name("nonCompositeId"),
	expression.Name("latitude"),
	expression.Name("longitude"),
	expression.Name("sender"),
	expression.Name("receiver"),
	expression.Name("mailbox"),
	expression.Name("unlocked"),
	expression.Name("opened"),
	expression.Name("time"),
	expression.Name("radius"),
	expression.Name("locationSelectionManner"),
	expression.Name("formattedAddress"),
	expression.Name("placename"),
	expression.Name("placeId"),
)

func (h *crumbHelper) GetLatestCrumbs(timestamp, crumbId, otherUser string) (*queryResult[models.Crumb], error) {
	userid := utils.GetAuthenticatedUserid()
	pkName := "pk"
	skName := "sk"
	pk := models.CrumbPkPrefix + userid
	sk := models.CrumbSkPrefix + timestamp + models.CrumbIdPrefix + crumbId + models.CrumbOtherUserPrefix + otherUser

	var lastKey *map[string]types.AttributeValue = &map[string]types.AttributeValue{
		pkName: &types.AttributeValueMemberS{Value: pk},
		skName: &types.AttributeValueMemberS{Value: sk},
	}

	if strings.TrimSpace(timestamp) == "" || strings.TrimSpace(crumbId) == "" || strings.TrimSpace(otherUser) == "" {
		lastKey = nil
	}

	keyCond := expression.KeyEqual(
		expression.Key(pkName),
		expression.Value(pk),
	)

	projection := defaultCrumbProjection

	expr, err := expression.NewBuilder().WithKeyCondition(keyCond).WithProjection(projection).Build()
	if err != nil {
		return nil, err
	}

	return QueryItems(
		newHelper(h.Ctx, nil),
		lastKey,
		nil,
		expr,
		nil,
		nil,
		func(c []map[string]types.AttributeValue) []models.Crumb {
			return *models.ConvertToCrumbs(c, func(c *models.Crumb) {
			})
		},
	)
}

type content struct {
	Index     int    `json:"index"`
	Media     string `json:"media"`
	Thumbnail string `json:"thumbnail"`
	Caption   string `json:"caption,omitempty"`
}
type resItem struct {
	Latitude  float64
	Longitude float64
	Content   []content
}

func (h *crumbHelper) GetCrumbContent(crumbId string) (*resItem, error) {
	helper := newHelper(h.Ctx, nil)
	var crumb models.Crumb
	userid := utils.GetAuthenticatedUserid()

	// sender wants to view crumb
	keyCond := expression.KeyEqual(
		expression.Key("gsi"),
		expression.Value(models.CrumbPkPrefix+userid),
	).And(
		expression.KeyBeginsWith(
			expression.Key("gsiSk"),
			models.CrumbIdPrefix+crumbId+models.CrumbOtherUserPrefix,
		),
	)

	proj := expression.NamesList(
		expression.Name("caption"),
		expression.Name("media"),
		expression.Name("latitude"),
		expression.Name("longitude"),
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
		nil,
		aws.Int32(1),
		func(c []map[string]types.AttributeValue) []models.Crumb {
			return *models.ConvertToCrumbs(c, nil)
		},
	)

	if err != nil {
		return nil, err
	}

	if len(result.Items) < 1 {
		return nil, fmt.Errorf("No such crumb exists!")
	}

	crumb = result.Items[0]

	res := make([]content, len(crumb.Media))
	cloudfrontHelper := NewCloudfrontHelper(h.Ctx)

	for _, media := range crumb.Media {
		mediaKey, _, _ := cloudfrontHelper.GetSignedUrl(media.MediaKey, constants.CRUMB_MEDIA_URL_TTL)
		thumbnailKey, _, _ := cloudfrontHelper.GetSignedUrl(media.ThumbnailKey, constants.CRUMB_MEDIA_URL_TTL)

		res[media.Index] = content{
			Index:     media.Index,
			Media:     mediaKey,
			Thumbnail: thumbnailKey,
			Caption:   media.Caption,
		}
	}

	return &resItem{
		Latitude:  crumb.Latitude,
		Longitude: crumb.Longitude,
		Content:   res,
	}, nil
}
