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

	crumbs := make([]*models.Crumb, 0)

	for _, receiver := range crumb.Receivers {
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
	return TransactWrite(helper, transactions...)
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

func (h *crumbHelper) OpenCrumb(otherUser, crumbId string) ([]resItem, error) {
	// based on location manner, do a check to see if user can open crumb
	return h.getCrumbContent(otherUser, crumbId)
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
		func(c []map[string]types.AttributeValue) []models.Crumb {
			return *models.ConvertToCrumbs(c, func(c *models.Crumb) {
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

func (h *crumbHelper) getCrumbContent(otherUser, crumbId string) ([]resItem, error) {
	helper := newHelper(h.Ctx, nil)
	var crumb models.Crumb
	userid := utils.GetAuthenticatedUserid()

	// sender wants to view crumb
	keyCond := expression.KeyEqual(
		expression.Key("gsi"),
		expression.Value(models.CrumbPkPrefix+userid),
	).And(
		expression.KeyEqual(
			expression.Key("gsiSk"),
			expression.Value(models.CrumbIdPrefix+crumbId+models.CrumbOtherUserPrefix+otherUser),
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
