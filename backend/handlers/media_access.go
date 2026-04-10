package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"path"
	"strings"
	"time"

	"backend/models"
	"backend/utils"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/config"
	cfsign "github.com/aws/aws-sdk-go-v2/feature/cloudfront/sign"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
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

	objectKey, err := sanitizeObjectKey(body.Key)
	if err != nil {
		return models.InvalidRequestErrorResponse(err.Error()), nil
	}

	secret, err := getCloudFrontSecret(ctx)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to load CloudFront signing secret", err), nil
	}

	privateKeyPEM := normalizePEM(secret.PrivateKey)
	if privateKeyPEM == "" || strings.TrimSpace(secret.KeyPairID) == "" {
		return models.ServerSideErrorResponse("CloudFront signing secret is incomplete", nil), nil
	}

	cfSigner, err := cfsign.LoadPEMPrivKeyPKCS8AsSigner(strings.NewReader(privateKeyPEM))
	if err != nil {
		log.Printf("Invalid CloudFront private key: %v", err)
		return models.ServerSideErrorResponse("Invalid CloudFront private key", err), nil
	}

	rawURL := fmt.Sprintf("https://%s/%s", utils.GetDependencies().CloudFrontDomainName, objectKey)
	expiresAt := time.Now().UTC().Add(15 * time.Minute)

	signer := cfsign.NewURLSigner(secret.KeyPairID, cfSigner)

	signedURL, err := signer.Sign(rawURL, expiresAt)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to sign media URL", nil), nil
	}

	resp := mediaAccessResponse{
		URL:       signedURL,
		ExpiresAt: expiresAt.Format(time.RFC3339),
	}

	return models.SuccessfulGetRequestResponse(resp, nil), nil
}

func getCloudFrontSecret(ctx context.Context) (cloudFrontSecret, error) {
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return cloudFrontSecret{}, err
	}

	client := secretsmanager.NewFromConfig(cfg)

	out, err := client.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: &utils.GetDependencies().SecretArn,
	})
	if err != nil {
		return cloudFrontSecret{}, err
	}

	if out.SecretString == nil || strings.TrimSpace(*out.SecretString) == "" {
		return cloudFrontSecret{}, errors.New("secret string is empty")
	}

	var secret cloudFrontSecret
	if err := json.Unmarshal([]byte(*out.SecretString), &secret); err != nil {
		return cloudFrontSecret{}, err
	}

	return secret, nil
}

func sanitizeObjectKey(key string) (string, error) {
	key = strings.TrimSpace(key)
	key = strings.TrimPrefix(key, "/")
	key = path.Clean(key)

	if key == "." || key == "" {
		return "", errors.New("key is required")
	}

	if strings.HasPrefix(key, "../") || key == ".." {
		return "", errors.New("invalid key")
	}

	// if !strings.HasPrefix(key, "uploads/") {
	// 	return "", errors.New("key must start with uploads/")
	// }

	return key, nil
}

func normalizePEM(s string) string {
	s = strings.TrimSpace(s)
	s = strings.ReplaceAll(s, `\n`, "\n")
	return s
}
