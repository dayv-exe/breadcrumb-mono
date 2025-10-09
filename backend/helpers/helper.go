package helpers

import (
	"backend/utils"
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type helper struct {
	TableName string
	Ctx       context.Context
}

func NewHelper(ctx context.Context, tableName *string) *helper {
	if tableName == nil {
		tableName = &utils.HandlerDependencies.MainTableName
	}
	return &helper{
		TableName: *tableName,
		Ctx:       ctx,
	}
}

func PutItem[T utils.DatabaseFormattable](deps *helper, item *T) error {
	input := &dynamodb.PutItemInput{
		Item:      *utils.ToDatabaseFormat(*item),
		TableName: aws.String(deps.TableName),
	}

	_, putErr := utils.HandlerDependencies.DbClient.PutItem(deps.Ctx, input)

	if putErr != nil {
		log.Print("An error occurred while trying to put item in the db")
		return putErr
	}

	return nil
}

func DeleteItem(deps *helper, key *map[string]types.AttributeValue) error {
	input := &dynamodb.DeleteItemInput{
		Key:       *key,
		TableName: &deps.TableName,
	}

	_, err := utils.HandlerDependencies.DbClient.DeleteItem(deps.Ctx, input)
	if err != nil {
		log.Print("error while trying to delete item")
		return err
	}

	return nil
}

func getItem(deps *helper, key *map[string]types.AttributeValue) (*dynamodb.GetItemOutput, error) {
	input := &dynamodb.GetItemInput{
		Key:       *key,
		TableName: &deps.TableName,
	}

	// gets item from db
	output, err := utils.HandlerDependencies.DbClient.GetItem(deps.Ctx, input)
	if err != nil {
		log.Println("an error occurred while trying to get item from db")
		return nil, err
	}

	log.Println(*output)

	return output, nil
}

func ItemExists(deps *helper, key map[string]types.AttributeValue) (bool, error) {
	output, err := getItem(deps, &key)
	if err != nil {
		return false, err
	}

	log.Println(len(output.Item))

	return len(output.Item) > 0, nil
}

func GetAndConvertItem[T any](deps *helper, key map[string]types.AttributeValue, convertToStruct func(map[string]types.AttributeValue) T) (*T, error) {
	output, err := getItem(deps, &key)
	if err != nil {
		return nil, err
	}

	// converts item to struct
	item := convertToStruct(output.Item)

	return &item, nil
}

func QueryItems[T any](deps *helper, indexName *string, expression string, values map[string]types.AttributeValue, convertToStructs func([]map[string]types.AttributeValue) []T) (*[]T, error) {
	input := &dynamodb.QueryInput{
		TableName:                 &deps.TableName,
		IndexName:                 indexName,
		KeyConditionExpression:    &expression,
		ExpressionAttributeValues: values,
	}

	output, err := utils.HandlerDependencies.DbClient.Query(deps.Ctx, input)
	if err != nil {
		log.Print("an error occurred while trying to query")
		return nil, err
	}

	items := convertToStructs(output.Items)

	return &items, nil
}

func UsePut[T utils.DatabaseFormattable](item T, tableName string, conditionExpression *string) types.TransactWriteItem {
	return types.TransactWriteItem{
		Put: &types.Put{
			Item:                *utils.ToDatabaseFormat(item),
			TableName:           &tableName,
			ConditionExpression: conditionExpression,
		},
	}
}

func UseDelete(key map[string]types.AttributeValue, tableName string) types.TransactWriteItem {
	return types.TransactWriteItem{
		Delete: &types.Delete{
			Key:       key,
			TableName: &tableName,
		},
	}
}

func UseUpdate(key map[string]types.AttributeValue, updateExpr string, exprAttrVal map[string]types.AttributeValue, tableName string) types.TransactWriteItem {
	return types.TransactWriteItem{
		Update: &types.Update{
			Key:                       key,
			TableName:                 &tableName,
			UpdateExpression:          &updateExpr,
			ExpressionAttributeValues: exprAttrVal,
		},
	}
}

func TransactWrite(deps *helper, transactions ...types.TransactWriteItem) error {
	input := &dynamodb.TransactWriteItemsInput{
		TransactItems: transactions,
	}

	_, err := utils.HandlerDependencies.DbClient.TransactWriteItems(deps.Ctx, input)
	if err != nil {
		log.Print("error while trying to transact write")
		// Check for transaction cancellation reasons
		utils.PrintTransactWriteCancellationReason(err)
		return err
	}

	return nil
}
