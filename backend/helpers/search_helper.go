package helpers

import (
	"backend/models"
	"backend/utils"
	"context"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type searchHelper struct {
	Ctx context.Context
}

func NewSearchHelper(ctx context.Context) *searchHelper {
	return &searchHelper{
		Ctx: ctx,
	}
}

func (this *searchHelper) SearchUser(searchStr string) (*[]models.UserDisplayInfo, error) {

	var matches []models.UserDisplayInfo
	seen := make(map[string]int)

	tokens := utils.SplitOnDelimiter(strings.ToLower(utils.NormalizeString(searchStr)), " ", "_", ".") // splits the search string into tokens

	helper := newHelper(this.Ctx, &utils.GetDependencies().SearchTableName)

	for _, token := range tokens {
		if len(token) >= models.UserSearchIndexPrefixLen {
			keyConditions := expression.KeyEqual(
				expression.Key("pk"),
				expression.Value(models.UserSearchIndexPkPrefix+token[:models.UserSearchIndexPrefixLen]),
			).And(
				expression.KeyBeginsWith(
					expression.Key("sk"),
					token,
				),
			)

			expr, _ := expression.NewBuilder().WithKeyCondition(keyConditions).Build()

			usersFound, err := QueryItems(
				helper,
				nil,
				nil,
				expr,
				aws.Int32(15),
				func(m []map[string]types.AttributeValue) []models.UserDisplayInfo {
					return *models.SearchItemsToUserInfoStruct(m)
				},
			)
			if err != nil {
				log.Println("An error occurred inside loop for querying tokens gotten from search string")
				return nil, err
			}

			if usersFound != nil {
				matches = append(matches, usersFound.Items...)
			}
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
