package models

// a way to standardize responses from functions triggered by apigateway event

import (
	"encoding/json"
	"log"

	"github.com/aws/aws-lambda-go/events"
)

type ResponseBody struct {
	Message interface{} `json:"message"`
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
	log.Println(msg)
	return buildResponse(400, ResponseBody{msg})
}

func UnauthorizedErrorResponse(msg string) events.APIGatewayV2HTTPResponse {
	if msg == "" {
		msg = "Unauthorized request."
	}
	log.Println(msg)
	return buildResponse(401, ResponseBody{msg})
}

func NotFoundResponse(msg string) events.APIGatewayV2HTTPResponse {
	if msg == "" {
		msg = "Resource not found."
	}

	log.Println(msg)
	return buildResponse(404, ResponseBody{msg})
}

func ServerSideErrorResponse(msg string, err error) events.APIGatewayV2HTTPResponse {
	if msg == "" {
		msg = "An error has occurred on our end, try again."
	}
	log.Println("Error source description: " + msg + " ERROR: " + err.Error())
	return buildResponse(500, ResponseBody{msg})
}

func SuccessfulRequestResponse(msg string, createdResource bool) events.APIGatewayV2HTTPResponse {
	if msg == "" {
		msg = "Request successful"
	}

	sCode := 200
	if createdResource {
		sCode = 201
	}

	return buildResponse(sCode, ResponseBody{msg})
}

func SuccessfulGetRequestResponse(body interface{}) events.APIGatewayV2HTTPResponse {
	return buildResponse(200, ResponseBody{
		body,
	})
}
