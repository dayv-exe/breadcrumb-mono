package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"context"
	"encoding/json"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

type SearchResult struct {
	models.UserSearch
	Type string `json:"type"`
}

func handleSearchUser(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// /search/{search_string}
	searchStr := req.PathParameters["str"]
	if len(searchStr) < models.UserSearchIndexPrefixLen {
		// return empty array if string length is too short
		return models.SuccessfulGetRequestResponse([]models.UserSearch{}, nil), nil
	}

	// only takes the first 2 - 20 chars in the search string to process and then search the database for
	maxChars := len((searchStr))

	if len(searchStr) > constants.MAX_SEARCH_STRING_CHARS {
		maxChars = constants.MAX_SEARCH_STRING_CHARS
	}

	searchStr = searchStr[:maxChars]

	results, err := helpers.NewSearchHelper(ctx).SearchUser(strings.ToLower(searchStr))

	if err != nil {
		return models.ServerSideErrorResponse("An error occurred while trying to search users.", err), nil
	}

	return models.SuccessfulGetRequestResponse(results, nil), nil
}

func handleSearchPlace(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// query, session token, proximity, origin
	query := strings.TrimSpace(strings.ToLower(req.PathParameters["str"]))
	if query == "" {
		return models.InvalidRequestErrorResponse("No query string provided!"), nil
	}

	var body helpers.SearchBody
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.ServerSideErrorResponse("Failed to unmarshal request body!", err), nil
	}

	if strings.TrimSpace(body.SessionToken) == "" {
		return models.InvalidRequestErrorResponse("No session token provided!"), nil
	}

	results, err := helpers.NewMapboxHelper(ctx).SearchPlace(query, body)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to search for place!", err), nil
	}

	return models.SuccessfulGetRequestResponse(results, nil), nil
}

func handleRetrievePlace(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// query, session token, proximity, origin
	placeId := strings.TrimSpace(req.PathParameters["str"])
	if placeId == "" {
		return models.InvalidRequestErrorResponse("No query string provided!"), nil
	}

	if len(placeId) < 2 {
		return models.SuccessfulGetRequestResponse([]any{}, nil), nil
	}

	var body helpers.RetrieveBody
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return models.ServerSideErrorResponse("Failed to unmarshal request body!", err), nil
	}

	if strings.TrimSpace(body.SessionToken) == "" {
		return models.InvalidRequestErrorResponse("No session token provided!"), nil
	}

	result, err := helpers.NewMapboxHelper(ctx).RetrievePlace(placeId, body)
	if err != nil {
		return models.ServerSideErrorResponse("Failed to retrieve place!", err), nil
	}

	return models.SuccessfulGetRequestResponse(result, nil), nil
}
