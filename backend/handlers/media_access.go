package handlers

import (
	"context"
	"encoding/json"
	"mime"
	"strings"
	"time"

	"backend/helpers"
	"backend/models"
	"backend/utils"

	"github.com/aws/aws-lambda-go/events"
)

type mediaAccessRequest struct {
	Key string `json:"key"`
}

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
	if utils.GetAuthUserId(req) == "" {
		return models.UnauthorizedErrorResponse("Unauthorized"), nil
	}

	var body mediaAccessRequest
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.InvalidRequestErrorResponse("Invalid JSON body"), nil
	}

	signedUrl, expiresAt, err := helpers.NewCloudfrontHelper(ctx).GetSignedUrl(body.Key, 15)

	if err != nil {
		return models.ServerSideErrorResponse("Failed to sign media key!", err), nil
	}

	resp := mediaAccessResponse{
		URL:       signedUrl,
		ExpiresAt: expiresAt.Format(time.RFC3339),
	}

	return models.SuccessfulGetRequestResponse(resp, nil), nil
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

	signedKeyUrl, _, err := helpers.NewCloudfrontHelper(ctx).GetSignedUrl(key.MediaKey, 15)
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
