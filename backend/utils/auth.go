package utils

import (
	"log"

	"github.com/aws/aws-lambda-go/events"
)

func GetAuthUserId(req events.APIGatewayV2HTTPRequest) string {

	if req.RequestContext.Authorizer == nil {
		log.Println("missing authorizer")
		return ""
	}

	jwt := req.RequestContext.Authorizer.JWT
	if jwt.Claims == nil {
		log.Println("missing JWT claims")
		return ""
	}

	sub, ok := jwt.Claims["sub"]
	if !ok || sub == "" {
		log.Println("missing or empty sub claim")
		return ""
	}

	return sub
}

func IsAuthenticatedUser(req events.APIGatewayV2HTTPRequest, userId string) bool {
	sub := GetAuthUserId(req)
	if sub == "" {
		return false
	}
	return sub == userId
}
