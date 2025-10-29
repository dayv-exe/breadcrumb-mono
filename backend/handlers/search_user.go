package handlers

import (
	"backend/constants"
	"backend/helpers"
	"backend/models"
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
)

type SearchResult struct {
	models.UserSearch
	Type string `json:"type"`
}

func handleSearchUser(ctx context.Context, req events.APIGatewayV2HTTPRequest) (events.APIGatewayV2HTTPResponse, error) {
	// /search/{search_string}
	searchStr := req.PathParameters["search_string"]
	if len(searchStr) < models.UserSearchIndexPrefixLen {
		// return empty array if string length is too short
		return models.SuccessfulGetRequestResponse([]models.UserSearch{}), nil
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

	return models.SuccessfulGetRequestResponse(results), nil
}
