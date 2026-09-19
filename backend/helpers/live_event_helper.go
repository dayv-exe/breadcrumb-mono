package helpers // wherever ShareCrumb lives

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	v4 "github.com/aws/aws-sdk-go-v2/aws/signer/v4"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
)

var (
	awsCfg     aws.Config
	signer     = v4.NewSigner()
	httpClient = &http.Client{Timeout: 5 * time.Second}
	publishURL = os.Getenv("EVENTS_PUBLISH_URL")
)

func init() {
	// If you already load an aws.Config in a shared package, reuse that instead.
	cfg, err := awsconfig.LoadDefaultConfig(context.Background())
	if err != nil {
		panic(fmt.Sprintf("load aws config: %v", err))
	}
	awsCfg = cfg
}

// The payload the recipient's client receives. Metadata only — media stays in S3.
type crumbEvent struct {
	ID         string `json:"id"`
	FromUserID string `json:"fromUserId"`
	S3Key      string `json:"s3Key"`
	Caption    string `json:"caption,omitempty"`
	CreatedAt  string `json:"createdAt"`
}

type publishBody struct {
	Channel string   `json:"channel"`
	Events  []string `json:"events"` // each element is a JSON *string*, not an object
}

func publishCrumb(ctx context.Context, toUserID string, ev crumbEvent) error {
	evJSON, err := json.Marshal(ev)
	if err != nil {
		return fmt.Errorf("marshal event: %w", err)
	}

	body, err := json.Marshal(publishBody{
		Channel: "/crumbs/" + toUserID,
		Events:  []string{string(evJSON)},
	})
	if err != nil {
		return fmt.Errorf("marshal body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, publishURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	creds, err := awsCfg.Credentials.Retrieve(ctx)
	if err != nil {
		return fmt.Errorf("retrieve creds: %w", err)
	}

	sum := sha256.Sum256(body)
	payloadHash := hex.EncodeToString(sum[:])

	// Service name for AppSync SigV4 is "appsync".
	if err := signer.SignHTTP(ctx, creds, req, payloadHash, "appsync", awsCfg.Region, time.Now()); err != nil {
		return fmt.Errorf("sign: %w", err)
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("publish request: %w", err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("publish status %d: %s", resp.StatusCode, respBytes)
	}

	// A 200 can still carry per-event failures in a "failed" array.
	var result struct {
		Failed []json.RawMessage `json:"failed"`
	}
	if err := json.Unmarshal(respBytes, &result); err == nil && len(result.Failed) > 0 {
		return fmt.Errorf("appsync rejected event: %s", respBytes)
	}
	return nil
}
