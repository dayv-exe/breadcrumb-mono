package handlers

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
)

type S3ObjectCreatedDetail struct {
	Bucket struct {
		Name string `json:"name"`
	} `json:"bucket"`
	Object struct {
		Key       string `json:"key"`
		Size      int64  `json:"size"`
		ETag      string `json:"etag"`
		Sequencer string `json:"sequencer"`
	} `json:"object"`
	Reason    string `json:"reason"`
	RequestID string `json:"request-id"`
}

func HandleProcessUpload(ctx context.Context, event events.EventBridgeEvent) error {
	return nil
}

func handleProcessFile() {

}
