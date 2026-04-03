package helpers

import (
	"backend/constants"
	"backend/utils"
	"context"
	"encoding/json"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
)

type QueueAction struct {
	SenderId    string          `json:"senderId"`
	RecipientId string          `json:"recipientId"`
	Action      string          `json:"action"`
	Payload     json.RawMessage `json:"payload"`
}

type ProcessMediaPayload struct {
	CrumbId    string `json:"id"`
	Path       string `json:"path"`
	MediaIndex int32  `json:"index"`
	IsVideo    bool   `json:"isVideo"`
}

type queueHelper struct {
	Ctx context.Context
}

func NewQueueHelper(ctx context.Context) *queueHelper {
	return &queueHelper{
		Ctx: ctx,
	}
}

func WithUpdateFriendsDisplayInfo(userid string) QueueAction {
	return QueueAction{
		SenderId: userid,
		Action:   constants.QUEUE_ACTION_UPDATE_FRIENDS_DISPLAY_INFO,
	}
}

func WithUpdateFriendRequestDisplayInfo(userId string) QueueAction {
	return QueueAction{
		SenderId: userId,
		Action:   constants.QUEUE_ACTION_UPDATE_REQUESTS_DISPLAY_INFO,
	}
}

func WithProcessVideo(crumbId, s3Path string, mediaIndex int32) QueueAction {
	payload, _ := json.Marshal(ProcessMediaPayload{
		CrumbId:    crumbId,
		Path:       s3Path,
		MediaIndex: mediaIndex,
		IsVideo:    true,
	})
	return QueueAction{
		Action:  constants.QUEUE_ACTION_PROCESS_VIDEO,
		Payload: payload,
	}
}

func (q *queueHelper) PutInQueue(action QueueAction) error {
	msg, err := json.Marshal(action)
	if err != nil {
		log.Printf("Failed to convert queue action to json!")
		return err
	}

	input := &sqs.SendMessageInput{
		QueueUrl:    &utils.GetDependencies().QueueUrl,
		MessageBody: aws.String(string(msg)),
	}

	_, err = utils.GetDependencies().SqsClient.SendMessage(q.Ctx, input)
	if err != nil {
		log.Printf("ERROR: Failed to send message to queue! \nERROR MESSAGE: %v", err)
		return err
	}

	println("message queued!")
	return nil
}
