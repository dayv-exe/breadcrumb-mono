package helpers

import (
	"backend/utils"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type LiveEvent struct {
	EventType string `json:"eventType"`
	Payload   any    `json:"payload"`
}

type liveEventHelper struct {
	Ctx context.Context
}

func NewLiveEventHelper(ctx context.Context) *liveEventHelper {
	return &liveEventHelper{
		Ctx: ctx,
	}
}

// PublishEvents sends one or more events to an AppSync Events channel using the
// the shape the Events HTTP endpoint expects. Max 5 events per call.
func (l *liveEventHelper) PublishEvents(channel string, events ...LiveEvent) error {
	deps := utils.GetDependencies()

	str := make([]string, 0, len(events))
	for _, e := range events {
		b, err := json.Marshal(e)
		if err != nil {
			return fmt.Errorf("marshal event: %w", err)
		}
		str = append(str, string(b))
	}

	body, err := json.Marshal(map[string]any{"channel": channel, "events": str})
	if err != nil {
		return fmt.Errorf("marshal body: %w", err)
	}

	req, err := http.NewRequestWithContext(l.Ctx, http.MethodPost, deps.LiveEventPublishUrl, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	creds, err := deps.AwsConfig.Credentials.Retrieve(l.Ctx)
	if err != nil {
		return fmt.Errorf("retrieve creds: %w", err)
	}

	sum := sha256.Sum256(body)
	if err := deps.Signer.SignHTTP(l.Ctx, creds, req, hex.EncodeToString(sum[:]),
		"appsync", deps.AwsConfig.Region, time.Now()); err != nil {
		return fmt.Errorf("sign: %w", err)
	}

	resp, err := deps.HttpClient.Do(req)
	if err != nil {
		return fmt.Errorf("publish request: %w", err)
	}
	defer resp.Body.Close()

	respBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("publish status %d: %s", resp.StatusCode, respBytes)
	}

	// 200 can still carry per-event failures.
	var result struct {
		Failed []json.RawMessage `json:"failed"`
	}
	if err := json.Unmarshal(respBytes, &result); err == nil && len(result.Failed) > 0 {
		return fmt.Errorf("appsync rejected event: %s", respBytes)
	}
	return nil
}
