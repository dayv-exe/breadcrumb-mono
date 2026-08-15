package handlers

import (
	"backend/constants"
	"backend/helpers"
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
)

func HandleQueueWorker(ctx context.Context, sqs events.SQSEvent) error {
	for _, msg := range sqs.Records {
		var action helpers.QueueAction
		if err := json.Unmarshal([]byte(msg.Body), &action); err != nil {
			log.Printf("FAILED TO UNMARSHAL MESSAGE! %v", err)
			continue
		}

		switch action.Action {
		case constants.QUEUE_ACTION_UPDATE_FRIENDS_DISPLAY_INFO:
			updateFriendDisplayInfo(ctx, action.SenderId)
			continue

		case constants.QUEUE_ACTION_UPDATE_REQUESTS_DISPLAY_INFO:
			continue
		case constants.QUEUE_ACTION_PROCESS_VIDEO:
			var payload helpers.ProcessMediaPayload
			if err := json.Unmarshal(action.Payload, &payload); err != nil {
				return err
			}

			processVid(ctx, payload)
			continue

		default:
			log.Println("Invalid queue action!")
		}
	}

	return nil
}

func updateFriendDisplayInfo(ctx context.Context, userid string) error {
	userHelper := helpers.NewUserHelper(ctx)
	userInfo, err := userHelper.FindById(userid)

	if err != nil {
		log.Printf("failed to get user info in queue actions")
		return err
	}

	if userInfo == nil {
		log.Printf("user not found, from queue actions")
		return err
	}

	friendHelper := helpers.NewFriendshipHelper(ctx)
	err = friendHelper.UpdateFriendDisplayInfo(userInfo)

	if err != nil {
		log.Printf("failed to update friend list!")
		return err
	}

	return nil
}

func updateFriendRequestDisplayInfo(ctx context.Context, userId string) error {
	// TODO: FIX LATER
	return nil
}

func processVid(ctx context.Context, payload helpers.ProcessMediaPayload) error {
	return nil
}
