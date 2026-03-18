package handlers

import (
	"backend/models"
	"backend/utils"
	"context"
	"encoding/json"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/google/uuid"
)

type Crumb struct {
	Pk        string   `json:"-" dynamodbav:"pk"`
	Sk        string   `json:"-" dynamodbav:"sk"`
	Id        string   `json:"id" dynamodbav:"id"`
	Sender    string   `json:"sender" dynamodbav:"sender"`
	Lat       string   `json:"lat" dynamodbav:"lat"`
	Lon       string   `json:"lon" dynamodbav:"lon"`
	MediaKeys []string `json:"mediaKeys" dynamodbav:"mediaKeys"`
}

func HandleCrumbActions(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	switch strings.ToLower(req.RequestContext.HTTP.Method) {
	case "post":
		return handleShareCrumb(ctx, req)

	default:
		return handleGetCrumbs(ctx, req)

	}
}

func handleShareCrumb(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// proof of concept function, i will make this better later
	userId := utils.GetAuthUserId(req)
	if userId == "" {
		return models.UnauthorizedErrorResponse("You need to be logged in to do this!"), nil
	}

	var body Crumb
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.InvalidRequestErrorResponse("Invalid request body!"), nil
	}

	randHash, err := uuid.NewRandom()
	body.Id = randHash.String()
	body.Pk = "CRUMB#"
	body.Sk = randHash.String()
	body.Sender = userId

	crumb, err := attributevalue.MarshalMap(body)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to marshal crumb db item!", err), nil
	}

	input := &dynamodb.PutItemInput{
		Item:      crumb,
		TableName: &utils.GetDependencies().MainTableName,
	}

	_, err = utils.GetDependencies().DbClient.PutItem(ctx, input)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to put item in db!", err), nil
	}

	return models.SuccessfulRequestResponse("Crumb sent!", true), nil
}

func handleGetCrumbs(ctx context.Context, _ events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	cond := expression.KeyEqual(
		expression.Key("pk"),
		expression.Value("CRUMB#"),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(cond).Build()
	if err != nil {
		return models.ServerSideErrorResponse("Failed to build expression!", err), nil
	}

	input := &dynamodb.QueryInput{
		TableName:                 &utils.GetDependencies().MainTableName,
		KeyConditionExpression:    expr.KeyCondition(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	}

	output, err := utils.GetDependencies().DbClient.Query(ctx, input)
	if len(output.Items) < 1 {
		return models.SuccessfulGetRequestResponse(nil, nil), nil
	}

	var crumbs []Crumb
	if err := attributevalue.UnmarshalListOfMaps(output.Items, &crumbs); err != nil {
		return models.ServerSideErrorResponse("Failed to unmarshal crumbs!", err), nil
	}

	return models.SuccessfulGetRequestResponse(crumbs, nil), nil
}
