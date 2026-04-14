package helpers

import (
	"backend/utils"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"path"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	cfsign "github.com/aws/aws-sdk-go-v2/feature/cloudfront/sign"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type cloudfrontHelper struct {
	Ctx context.Context
}

type cloudFrontSecret struct {
	PrivateKey string `json:"private_key"`
	PublicKey  string `json:"public_key"`
	KeyPairID  string `json:"key_pair_id"`
}

func NewCloudfrontHelper(ctx context.Context) *cloudfrontHelper {
	return &cloudfrontHelper{
		Ctx: ctx,
	}
}

func (h *cloudfrontHelper) GetSignedUrl(mediaKey string, ttl int16) (string, time.Time, error) {
	if strings.TrimSpace(mediaKey) == "" {
		return "", time.Now().UTC(), nil
	}
	objectKey, err := sanitizeObjectKey(mediaKey)
	if err != nil {
		return "", time.Now().UTC(), err
	}

	secret, err := getCloudFrontSecret(h.Ctx)
	if err != nil {
		log.Printf("Failed to load cloudfront secrets! %v", err)
		return "", time.Now().UTC(), err
	}

	privateKeyPEM := normalizePEM(secret.PrivateKey)
	if privateKeyPEM == "" || strings.TrimSpace(secret.KeyPairID) == "" {
		log.Printf("CloudFront signing secret is incomplete")
		return "", time.Now().UTC(), fmt.Errorf("CloudFront signing secret is incomplete")
	}

	cfSigner, err := cfsign.LoadPEMPrivKeyPKCS8AsSigner(strings.NewReader(privateKeyPEM))
	if err != nil {
		log.Printf("Invalid CloudFront private key: %v", err)
		return "", time.Now().UTC(), err
	}

	rawURL := fmt.Sprintf("https://%s/%s", utils.GetDependencies().CloudFrontDomainName, objectKey)
	expiresAt := time.Now().UTC().Add(15 * time.Minute)

	signer := cfsign.NewURLSigner(secret.KeyPairID, cfSigner)

	signedUrl, err := signer.Sign(rawURL, expiresAt)
	if err != nil {
		log.Printf("Failed to sign key: %v", err)
		return "", time.Now().UTC(), err
	}

	return signedUrl, expiresAt, nil
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
