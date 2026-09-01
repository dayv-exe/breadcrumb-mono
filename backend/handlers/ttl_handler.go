package handlers

import (
	"backend/helpers"
	"backend/models"
	"context"
	"log"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

func HandleTTlExpired(ctx context.Context, e events.DynamoDBEvent) error {
	for _, record := range e.Records {
		if record.EventName != "REMOVE" {
			continue
		}

		old := record.Change.OldImage

		pk := old["pk"].String()
		sk := old["sk"].String()

		log.Printf("expired item pk=%s sk=%s", pk, sk)

		if !strings.HasPrefix(pk, models.MediaDraftPkPrefix) || !strings.HasPrefix(sk, models.MediaDraftSkPrefix) {
			// is not an expired draft media flag
			continue
		}

		mediaKey := old["mediaKey"].String()
		if strings.TrimSpace(mediaKey) == "" {
			log.Printf("WARNING: Invalid key provided for draft media!")
		}
		err := helpers.NewS3Helper(ctx).DeleteObj(mediaKey)
		if err != nil {
			log.Printf("ERROR: Failed to delete draft media! REASON: %#v", err)
		}
	}

	return nil
}
