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
		return models.InvalidRequestErrorResponse("Not yet implemented"), nil
	case "presign":
		return handleGeneratePresignedUrls(ctx, req)

	default:
		return models.InvalidRequestErrorResponse("Invalid action!"), nil
	}
}

func handleGetProfilePictureUrl(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	userId := req.PathParameters["id"]
	if strings.TrimSpace(userId) == "" {
		userId = utils.GetAuthenticatedUserid()
	}

	key, err := helpers.NewUserHelper(ctx).GetProfilePicKeys(userId)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get media key!", err), nil
	}

	signedKeyUrl, _, err := helpers.NewCloudfrontHelper(ctx).GetSignedUrl(key.MediaKey, constants.PROFILE_PICTURE_URL_TTL)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get signed url!", err), nil
	}

	signedThumbnailKeyUrl, _, err := helpers.NewCloudfrontHelper(ctx).GetSignedUrl(key.ThumbnailKey, constants.PROFILE_PICTURE_URL_TTL)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to get signed url!", err), nil
	}

	return models.SuccessfulGetRequestResponse(models.CrumbMedia{
		MediaKey:     signedKeyUrl,
		ThumbnailKey: signedThumbnailKeyUrl,
	}, nil), nil
}
