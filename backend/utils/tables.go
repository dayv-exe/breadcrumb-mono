package utils

import (
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type Helper struct {
	TableName string
	DbClient  *dynamodb.Client
	Ctx       context.Context
}

func PutItem[T DatabaseFormattable](deps *Helper, item *T) error {
	input := &dynamodb.PutItemInput{
		Item:      *ToDatabaseFormat(*item),
		TableName: aws.String(deps.TableName),
	}

	_, putErr := deps.DbClient.PutItem(deps.Ctx, input)

	if putErr != nil {
		log.Print("An error occurred while trying to put item in the db")
		return putErr
	}

	return nil
}

func DeleteItem(deps *Helper, key *map[string]types.AttributeValue) error {
	input := &dynamodb.DeleteItemInput{
		Key:       *key,
		TableName: aws.String(deps.TableName),
	}

	_, err := deps.DbClient.DeleteItem(deps.Ctx, input)
	if err != nil {
		log.Print("error while trying to delete item")
		return err
	}

	return nil
}

func getItem(deps *Helper, key *map[string]types.AttributeValue) (*dynamodb.GetItemOutput, error) {
	input := &dynamodb.GetItemInput{
		Key:       *key,
		TableName: &deps.TableName,
	}

	// gets item from db
	output, err := deps.DbClient.GetItem(deps.Ctx, input)
	if err != nil {
		log.Println("an error occurred while trying to get item from db")
		return nil, err
	}

	return output, nil
}

func ItemExists(deps *Helper, key *map[string]types.AttributeValue) (bool, error) {
	output, err := getItem(deps, key)
	if err != nil {
		return false, err
	}

	return len(output.Item) > 0, nil
}

func GetAndConvertItem[T any](deps *Helper, key *map[string]types.AttributeValue, convertToStruct func(map[string]types.AttributeValue) T) (*T, error) {
	output, err := getItem(deps, key)
	if err != nil {
		return nil, err
	}

	// converts item to struct
	item := convertToStruct(output.Item)

	return &item, nil
}

func QueryItems[T any](deps *Helper, expression string, values *map[string]types.AttributeValue, convertToStructs func([]map[string]types.AttributeValue) []T) (*[]T, error) {
	input := &dynamodb.QueryInput{
		TableName:                 &deps.TableName,
		KeyConditionExpression:    &expression,
		ExpressionAttributeValues: *values,
	}

	output, err := deps.DbClient.Query(deps.Ctx, input)
	if err != nil {
		log.Print("an error occurred while trying to query")
		return nil, err
	}

	items := convertToStructs(output.Items)

	return &items, nil
}

func UsePut[T DatabaseFormattable](item *T, tableName string) types.TransactWriteItem {
	return types.TransactWriteItem{
		Put: &types.Put{
			Item:      *ToDatabaseFormat(*item),
			TableName: &tableName,
		},
	}
}

func UseDelete(key *map[string]types.AttributeValue, tableName string) types.TransactWriteItem {
	return types.TransactWriteItem{
		Delete: &types.Delete{
			Key:       *key,
			TableName: &tableName,
		},
	}
}

func TransactWrite(deps *Helper, transactions ...types.TransactWriteItem) error {
	input := &dynamodb.TransactWriteItemsInput{
		TransactItems: transactions,
	}

	_, err := deps.DbClient.TransactWriteItems(deps.Ctx, input)
	if err != nil {
		log.Print("error while trying to transact write")
		// Check for transaction cancellation reasons
		PrintTransactWriteCancellationReason(err)
		return err
	}

	return nil
}
