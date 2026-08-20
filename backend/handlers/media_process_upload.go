package handlers

import (
	"backend/helpers"
	"backend/utils"
	"context"
	"log"

	"github.com/aws/aws-lambda-go/events"
)

func HandleProcessUpload(ctx context.Context, event events.EventBridgeEvent) error {
	details, err := utils.UnmarshalS3ObjectCreatedDetails(event)
	if err != nil {
		log.Printf("ERROR: Failed to unmarshal s3 event!")
		return err
	}

	userid := utils.GetUseridFromKey(details.Object.Key)
	crumbNonCompositeId := utils.GetCrumbNonCompositeIdFromKey(details.Object.Key)

	// check if crumb has been shared, if so media should not be flagged as draft
	crumbExists, err := helpers.NewCrumbHelper(ctx).CrumbExists(userid, crumbNonCompositeId)
	if err != nil {
		log.Printf("ERROR: Failed to check if crumb exists!")
		return err
	}

	if crumbExists {
		// if media upload completes after crumb has been shared
		return nil
	}

	draftHelper := helpers.NewDraftMediaFlagHelper(ctx)
	err = draftHelper.PutNewDraftMediaFlag(userid, details.Object.Key)
	if err != nil {
		return err
	}

	return nil
}

func handleProcessFile() {

}
