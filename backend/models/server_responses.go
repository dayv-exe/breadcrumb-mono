package models

// a way to standardize responses from functions triggered by apigateway event

import (
	"encoding/base64"
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type ResponseBody struct {
	Message          interface{} `json:"message"`
	LastEvaluatedKey interface{} `json:"next,omitempty"`
}

// buildResponse builds a standard API Gateway proxy response
func buildResponse(statusCode int, body ResponseBody) events.APIGatewayV2HTTPResponse {
	jsonBody, _ := json.Marshal(body)

	return events.APIGatewayV2HTTPResponse{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(jsonBody),
	}
}

func InvalidRequestErrorResponse(msg string) events.APIGatewayV2HTTPResponse {
	if msg == "" {
		msg = "Invalid request body."
	}
	return buildResponse(400, ResponseBody{
		Message:          msg,
		LastEvaluatedKey: nil,
	})
}

func UnauthorizedErrorResponse(msg string) events.APIGatewayV2HTTPResponse {
	if msg == "" {
		msg = "Unauthorized request."
	}
	return buildResponse(401, ResponseBody{msg, nil})
}

func ForbiddenErrorResponse(msg string) events.APIGatewayV2HTTPResponse {
	if msg == "" {
		msg = "Insufficient Permissions"
	}
	return buildResponse(403, ResponseBody{msg, nil})
}

func NotFoundResponse(msg string) events.APIGatewayV2HTTPResponse {
	if msg == "" {
		msg = "Resource not found."
	}

	return buildResponse(404, ResponseBody{msg, nil})
}

func ServerSideErrorResponse(msg string, err error) events.APIGatewayV2HTTPResponse {
	if msg == "" {
		msg = "An error has occurred on our end, try again."
	}
	log.Println("Error source description: " + msg + " ERROR: " + err.Error())
	return buildResponse(500, ResponseBody{msg, nil})
}

func SuccessfulRequestResponse(msg string, createdResource bool) events.APIGatewayV2HTTPResponse {
	if msg == "" {
		msg = "Request successful"
	}

	sCode := 200
	if createdResource {
		sCode = 201
	}

	return buildResponse(sCode, ResponseBody{msg, nil})
}

func SuccessfulGetRequestResponse(body interface{}, lastEvaluatedKey *map[string]types.AttributeValue) events.APIGatewayV2HTTPResponse {
	if lastEvaluatedKey != nil {
		key := encodeLastEvalKey(*lastEvaluatedKey)
		return buildResponse(200, ResponseBody{
			Message:          body,
			LastEvaluatedKey: key,
		})
	}

	return buildResponse(200, ResponseBody{
		Message:          body,
		LastEvaluatedKey: nil,
	})
}

func encodeLastEvalKey(key map[string]types.AttributeValue) string {
	if key == nil {
		return ""
	}

	jsonBytes, err := attributevalue.MarshalMapJSON(key)
	if err != nil {
		log.Panicf("Failed to marshal last key: %v, error: %v", key, err)
	}

	return base64.URLEncoding.EncodeToString(jsonBytes)
}

func DecodeLastEvalKey(key string) (map[string]types.AttributeValue, error) {

	if key == "" {
		return nil, nil
	}

	decoded, err := base64.URLEncoding.DecodeString(key)
	if err != nil {
		return nil, err
	}

	lastKey, err := attributevalue.UnmarshalMapJSON(decoded)
	if err != nil {
		return nil, err
	}

	return lastKey, nil
}
