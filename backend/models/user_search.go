package models

import (
	"backend/utils"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

const (
	UserSearchIndexPkPrefix  = "USER_INDEX#"
	UserSearchIndexPrefixLen = 2
)

type UserSearch struct {
	UserDisplayInfo
	Rating int `json:"rating"`
}

type userSearchDbItem struct {
	Pk     string `dynamodbav:"pk"`
	Sk     string `dynamodbav:"sk"`
	Userid string `dynamodbav:"userid" json:"userid"`
	UserDisplayInfoNoId
}

func (u *UserSearch) buildSearchIndexes() []map[string]types.AttributeValue {
	// returns items to be put in the database that contains search index
	// for example
	// john.test this function will return
	// pk: jo, sk: john
	// pk: te, sk: test

	u.Nickname = strings.ToLower(u.Nickname)

	var tokens []string
	tokens = append(tokens, utils.SplitOnDelimiter(strings.ToLower(utils.NormalizeString(u.Name)), " ", "_", ".")...)
	tokens = append(tokens, utils.SplitOnDelimiter(utils.NormalizeString(u.Nickname), " ", "_", ".")...)

	var indexes []map[string]types.AttributeValue
	seen := make(map[string]struct{})

	for _, token := range tokens {
		// get values
		// if name to tokenize is not long enough, skip tokenization process
		if len(strings.TrimSpace(token)) < UserSearchIndexPrefixLen || len(strings.TrimSpace(token[:UserSearchIndexPrefixLen])) < UserSearchIndexPrefixLen {
			continue // skip
		}

		pk := UserSearchIndexPkPrefix + token[:UserSearchIndexPrefixLen]
		sk := token + "#" + strings.Trim(u.Userid, UserPkPrefix)

		if _, ok := seen[pk+"|"+sk]; !ok {
			// seen now if not seen before
			seen[pk+"|"+sk] = struct{}{}

			// new index item
			new := userSearchDbItem{
				Pk:     pk,
				Sk:     sk,
				Userid: u.Userid,
				UserDisplayInfoNoId: UserDisplayInfoNoId{
					Nickname: u.Nickname,
					Name:     u.Name,
				},
			}

			item, err := attributevalue.MarshalMap(new)
			if err != nil {
				log.Panicf("An error occurred while marshaling user search db item: %v", err)
			}

			indexes = append(indexes, item)
		}
	}

	return indexes
}

func GetUserSearchIndexesKeys(dbIndexItems []map[string]types.AttributeValue) []map[string]types.AttributeValue {
	// this function returns a slice containing the pk and sk of database items parsed into it
	var keys []map[string]types.AttributeValue
	seen := make(map[string]struct{})

	for _, item := range dbIndexItems {
		pk, pkOk := item["pk"].(*types.AttributeValueMemberS)
		sk, skOk := item["sk"].(*types.AttributeValueMemberS)

		if pkOk && skOk {
			// if is valid database index item
			compKey := pk.Value + sk.Value

			if _, ok := seen[compKey]; !ok {
				// not seen before
				// make it seen now
				seen[compKey] = struct{}{}

				// append
				keys = append(keys, map[string]types.AttributeValue{
					"pk": pk,
					"sk": sk,
				})

			}
		}
	}

	return keys
}

func SearchItemsToUserInfoStruct(items []map[string]types.AttributeValue) *[]UserDisplayInfo {
	searchItems := utils.DatabaseItemsToStructs(items, func(s *userSearchDbItem) {
		s.Userid = strings.TrimPrefix(s.Userid, UserPkPrefix)
	})

	var users []UserDisplayInfo
	for _, user := range *searchItems {
		users = append(users, UserDisplayInfo{
			Userid:   user.Userid,
			Nickname: user.Nickname,
			Name:     user.Name,
		})
	}

	return &users
}

func GetUserSearchIndexItems(user *User) []types.TransactWriteItem {
	// Adds items to search table to allow for queries where search string is similar to nickname or full name
	builder := UserSearch{
		UserDisplayInfo: *NewUserDisplayInfo(*user),
	}

	indexes := builder.buildSearchIndexes()

	// creates slice of items
	var items []types.TransactWriteItem
	for _, index := range indexes {
		items = append(items, types.TransactWriteItem{
			Put: &types.Put{
				TableName: aws.String(utils.GetDependencies().SearchTableName),
				Item:      index,
			},
		})
	}

	return items
}

func GetDeleteUserIndexesItems(user *User) []types.TransactWriteItem {
	// rebuild indexes, then query them and get their primary keys
	builder := UserSearch{
		UserDisplayInfo: *NewUserDisplayInfo(*user),
	}

	indexes := builder.buildSearchIndexes()

	keys := GetUserSearchIndexesKeys(indexes)
	var items []types.TransactWriteItem
	for _, key := range keys {
		items = append(items, types.TransactWriteItem{
			Delete: &types.Delete{
				TableName: aws.String(utils.GetDependencies().SearchTableName),
				Key:       key,
			},
		})
	}

	return items
}
