package helpers

import (
	"backend/models"
	"backend/utils"
	"context"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type searchDynamoHelper struct {
	Ctx context.Context
}

func NewSearchHelper(ctx context.Context) *searchDynamoHelper {
	return &searchDynamoHelper{
		Ctx: ctx,
	}
}

func (this *searchDynamoHelper) SearchUser(searchStr string) (*[]models.UserDisplayInfo, error) {

	var matches []models.UserDisplayInfo
	seen := make(map[string]int)

	tokens := utils.SplitOnDelimiter(strings.ToLower(utils.NormalizeString(searchStr)), " ", "_", ".") // splits the search string into tokens

	helper := NewHelper(this.Ctx, &utils.HandlerDependencies.SearchTableName)

	for _, token := range tokens {
		if len(token) >= models.UserSearchIndexPrefixLen {
			usersFound, err := QueryItems(
				helper,
				nil,
				"pk = :pk AND begins_with(sk, :skPrefix)",
				map[string]types.AttributeValue{
					":pk":       &types.AttributeValueMemberS{Value: models.UserSearchIndexPkPrefix + token[:models.UserSearchIndexPrefixLen]},
					":skPrefix": &types.AttributeValueMemberS{Value: token}},
				func(m []map[string]types.AttributeValue) []models.UserDisplayInfo {
					return *models.SearchItemsToUserInfoStruct(m)
				},
			)
			if err != nil {
				log.Println("An error occurred inside loop for querying tokens gotten from search string")
				return nil, err
			}
			matches = append(matches, (*usersFound)...)
		}
	}

	// loop through matches and rank them and put them in results
	var result []models.UserDisplayInfo
	for index, user := range matches {
		user.Userid = strings.TrimPrefix(user.Userid, models.UserPkPrefix) // removes the 'USER#'
		key := user.Userid
		_, ok := seen[key]
		if !ok {
			// first time seen
			seen[key] = index
			result = append(result, user)
		}
	}

	return &result, nil
}
