package helpers

import (
	"backend/models"
	"backend/utils"
	"context"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type SearchDynamoHelper struct {
	Dependencies *utils.HandlerDependencies
	Ctx          context.Context
}

func (this *SearchDynamoHelper) SearchUser(searchStr string, limit int32) (*[]models.UserDisplayInfo, error) {

	var matches []models.UserDisplayInfo
	seen := make(map[string]int)

	tokens := utils.SplitOnDelimiter(strings.ToLower(utils.NormalizeString(searchStr)), " ", "_", ".") // splits the search string into tokens

	for _, token := range tokens {
		if len(token) >= models.UserSearchIndexPrefixLen {
			input := dynamodb.QueryInput{
				TableName:              aws.String(this.Dependencies.SearchTableName),
				KeyConditionExpression: aws.String("pk = :pk AND begins_with(sk, :skPrefix)"),
				ExpressionAttributeValues: map[string]types.AttributeValue{
					":pk":       &types.AttributeValueMemberS{Value: models.UserSearchIndexPkPrefix + token[:models.UserSearchIndexPrefixLen]},
					":skPrefix": &types.AttributeValueMemberS{Value: token},
				},
				Limit: aws.Int32(limit),
			}

			found, qErr := this.Dependencies.DbClient.Query(this.Ctx, &input)
			if qErr != nil {
				log.Println("An error occurred inside loop for querying tokens gotten from search string")
				return nil, qErr
			}

			usersFound := models.SearchItemsToUserInfoStruct(&found.Items)

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

func (this *SearchDynamoHelper) GetUserSearchIndexItems(user *models.User) ([]types.TransactWriteItem, error) {
	// Adds items to search table to allow for queries where search string is similar to nickname or full name
	builder := models.UserSearch{
		UserDisplayInfo: *models.NewUserDisplayInfo(*user),
	}

	indexes, err := builder.BuildSearchIndexes()

	if err != nil {
		return nil, err
	}

	// creates slice of items
	var items []types.TransactWriteItem
	for _, index := range indexes {
		items = append(items, types.TransactWriteItem{
			Put: &types.Put{
				TableName: aws.String(this.Dependencies.SearchTableName),
				Item:      index,
			},
		})
	}

	return items, nil
}

func (this *SearchDynamoHelper) GetDeleteUserIndexesItems(user *models.User) ([]types.TransactWriteItem, error) {
	// rebuild indexes, then query them and get their primary keys
	builder := models.UserSearch{
		UserDisplayInfo: *models.NewUserDisplayInfo(*user),
	}

	indexes, builderErr := builder.BuildSearchIndexes()
	if builderErr != nil {
		return nil, builderErr
	}

	keys := models.GetUserSearchIndexesKeys(indexes)
	var items []types.TransactWriteItem
	for _, key := range keys {
		items = append(items, types.TransactWriteItem{
			Delete: &types.Delete{
				TableName: aws.String(this.Dependencies.SearchTableName),
				Key:       key,
			},
		})
	}

	log.Println(items)

	return items, nil
}
