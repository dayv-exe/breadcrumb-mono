package handlers

import (
	"context"
	"mime"
	"strings"

	"backend/constants"
	"backend/helpers"
	"backend/models"
	"backend/utils"

	"github.com/aws/aws-lambda-go/events"
)

type mediaAccessResponse struct {
	URL       string `json:"url"`
	ExpiresAt string `json:"expiresAt"`
}

type cloudFrontSecret struct {
	PrivateKey string `json:"private_key"`
	PublicKey  string `json:"public_key"`
	KeyPairID  string `json:"key_pair_id"`
}

// sign, presign

func HandleMediaAccess(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	mime.AddExtensionType(".mov", "video/quicktime")
	mime.AddExtensionType(".heic", "image/heic")
	mime.AddExtensionType(".heif", "image/heif")
	mime.AddExtensionType(".avif", "image/avif")
	mime.AddExtensionType(".mp4", "video/mp4")
	mime.AddExtensionType(".m4a", "audio/mp4")
	action := req.QueryStringParameters["action"]
	switch strings.ToLower(action) {
	case "sign":
		return handleSignMediaUrl(ctx, req)
	case "presign":
		return handleGeneratePresignedUrls(ctx, req)

	default:
		return models.InvalidRequestErrorResponse("Invalid action!"), nil
	}
}

func handleSignMediaUrl(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	crumbId := strings.TrimSpace(strings.ToLower(req.QueryStringParameters["crumbId"]))
	sentCrumb := strings.TrimSpace(strings.ToLower(req.QueryStringParameters["sent"])) == "true"
	userId := utils.GetAuthUserId(req)
	if crumbId == "" {
		return models.InvalidRequestErrorResponse("No id provided!"), nil
	}

	if userId == "" {
		return models.UnauthorizedErrorResponse("Unauthorized"), nil
	}

	crumbHelper := helpers.NewCrumbHelper(ctx)
	crumb, err := crumbHelper.GetCrumb(userId, crumbId, sentCrumb)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get crumb, try again!", err), nil
	}

	if crumb == nil {
		return models.NotFoundResponse("No such crumb exists!"), nil
	}

	type resItem struct {
		Index     int              `json:"index"`
		Media     string           `json:"media"`
		Overlay   string           `json:"overlay"`
		Thumbnail string           `json:"thumbnail"`
		Text      models.CrumbText `json:"text,omitempty"`
	}

	res := make(map[int]resItem, 0)
	cloudfrontHelper := helpers.NewCloudfrontHelper(ctx)

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

	type crumbText struct {
		Text models.CrumbText `json:"text"`
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

	return models.SuccessfulGetRequestResponse(res, nil), nil
}

func handleGetProfilePictureUrl(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := req.QueryStringParameters["userid"]
	if strings.TrimSpace(userId) == "" {
		return models.SuccessfulGetRequestResponse("", nil), nil
	}

	key, err := helpers.NewUserHelper(ctx).GetProfilePicKeys(userId)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get media key!", err), nil
	}

	signedKeyUrl, _, err := helpers.NewCloudfrontHelper(ctx).GetSignedUrl(key.MediaKey, constants.PROFILE_PICTURE_URL_TTL)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get signed url!", err), nil
	}

	signedThumbnailKeyUrl, _, err := helpers.NewCloudfrontHelper(ctx).GetSignedUrl(key.ThumbnailKey, 15)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get signed url!", err), nil
	}

	return models.SuccessfulGetRequestResponse(models.CrumbMedia{
		MediaKey:     signedKeyUrl,
		ThumbnailKey: signedThumbnailKeyUrl,
	}, nil), nil
}
