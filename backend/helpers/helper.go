package helpers

import (
	"backend/utils"
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type helper struct {
	TableName string
	Ctx       context.Context
}

func newHelper(ctx context.Context, tableName *string) *helper {
	if tableName == nil {
		tableName = &utils.GetDependencies().MainTableName
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

	_, putErr := utils.GetDependencies().DbClient.PutItem(deps.Ctx, input)

	if putErr != nil {
		log.Print("An error occurred while trying to put item in the db")
		return putErr
	}

	return nil
}

func UpdateItem(deps *helper, key *map[string]types.AttributeValue, expr expression.Expression) error {
	input := &dynamodb.UpdateItemInput{
		Key:                       *key,
		TableName:                 &utils.GetDependencies().MainTableName,
		UpdateExpression:          expr.Update(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
	}

	_, err := utils.GetDependencies().DbClient.UpdateItem(deps.Ctx, input)
	if err != nil {
		return err
	}

	return nil
}

func DeleteItem(deps *helper, key *map[string]types.AttributeValue) error {
	input := &dynamodb.DeleteItemInput{
		Key:       *key,
		TableName: &deps.TableName,
	}

	_, err := utils.GetDependencies().DbClient.DeleteItem(deps.Ctx, input)
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
	output, err := utils.GetDependencies().DbClient.GetItem(deps.Ctx, input)
	if err != nil {
		log.Println("an error occurred while trying to get item from db")
		return nil, err
	}

	return output, nil
}

func ItemExists(deps *helper, key map[string]types.AttributeValue) (bool, error) {
	output, err := getItem(deps, &key)
	if err != nil {
		return false, err
	}

	return len(output.Item) > 0, nil
}

func GetAndConvertItem[T any](deps *helper, key map[string]types.AttributeValue, convertToStruct func(map[string]types.AttributeValue) T) (*T, error) {
	output, err := getItem(deps, &key)
	if err != nil {
		return nil, err
	}

	if len(output.Item) < 1 {
		return nil, nil
	}

	// converts item to struct
	item := convertToStruct(output.Item)

	return &item, nil
}

func QueryItems[T any](deps *helper, indexName *string, expression expression.Expression, convertToStructs func([]map[string]types.AttributeValue) []T) (*[]T, error) {
	input := &dynamodb.QueryInput{
		TableName:                 &deps.TableName,
		IndexName:                 indexName,
		KeyConditionExpression:    expression.KeyCondition(),
		ExpressionAttributeNames:  expression.Names(),
		ExpressionAttributeValues: expression.Values(),
	}

	output, err := utils.GetDependencies().DbClient.Query(deps.Ctx, input)
	if err != nil {
		log.Print("an error occurred while trying to query")
		return nil, err
	}

	if len(output.Items) < 1 {
		return nil, nil
	}

	items := convertToStructs(output.Items)

	return &items, nil
}

func BatchWriteItems(deps *helper, requests ...types.WriteRequest) error {
	context, cancel := context.WithTimeout(deps.Ctx, 10*time.Second)
	defer cancel()

	const chunkSize = 25

	const maxAttempts = 10
	const baseBackOff = 50 * time.Millisecond
	const maxJitter = 50 * time.Millisecond

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	for i := 0; i < len(requests); i += chunkSize {
		end := i + chunkSize
		if end > len(requests) {
			end = len(requests)
		}

		unprocessed := map[string][]types.WriteRequest{
			deps.TableName: requests[i:end],
		}

		for attempt := 0; attempt < maxAttempts && len(unprocessed) > 0; attempt++ {
			if err := context.Err(); err != nil {
				return fmt.Errorf("batch write aborted (context): %w", err)
			}

			input := &dynamodb.BatchWriteItemInput{
				RequestItems: unprocessed,
			}

			out, err := utils.GetDependencies().DbClient.BatchWriteItem(context, input)
			if err != nil {
				return fmt.Errorf("batch write to %s failed (chunk %d-%d, attempt %d/%d): %w",
					deps.TableName, i, end-1, attempt+1, maxAttempts, err)
			}

			unprocessed = out.UnprocessedItems
			if len(unprocessed) == 0 {
				break
			}

			backoff := baseBackOff * time.Duration(1<<attempt)
			jitter := time.Duration(rng.Int63n(int64(maxJitter)))
			sleep := backoff + jitter

			timer := time.NewTimer(sleep)
			select {
			case <-context.Done():
				timer.Stop()
				return fmt.Errorf("batch write aborted during backoff: %w", context.Err())
			case <-timer.C:
			}
		}

		if len(unprocessed) > 0 {
			// At this point we tried maxAttempts and still have unprocessed writes.
			remaining := 0
			if v, ok := unprocessed[deps.TableName]; ok {
				remaining = len(v)
			}
			return fmt.Errorf("batch write incomplete for %s (chunk %d-%d): %d unprocessed after %d attempts",
				deps.TableName, i, end-1, remaining, maxAttempts)
		}
	}

	return nil

}

func UsePutBatchItem[T utils.DatabaseFormattable](deps *helper, item T) types.WriteRequest {
	return types.WriteRequest{PutRequest: &types.PutRequest{
		Item: *utils.ToDatabaseFormat(item),
	}}
}

func UsePut[T utils.DatabaseFormattable](item T, tableName string, conditionExpression *expression.Expression) types.TransactWriteItem {
	return types.TransactWriteItem{
		Put: &types.Put{
			Item:                      *utils.ToDatabaseFormat(item),
			TableName:                 &tableName,
			ConditionExpression:       conditionExpression.Condition(),
			ExpressionAttributeNames:  conditionExpression.Names(),
			ExpressionAttributeValues: conditionExpression.Values(),
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

func UseUpdate(key map[string]types.AttributeValue, updateExpr expression.Expression, tableName string) types.TransactWriteItem {
	return types.TransactWriteItem{
		Update: &types.Update{
			Key:                       key,
			TableName:                 &tableName,
			UpdateExpression:          updateExpr.Update(),
			ExpressionAttributeNames:  updateExpr.Names(),
			ExpressionAttributeValues: updateExpr.Values(),
		},
	}
}

func TransactWrite(deps *helper, transactions ...types.TransactWriteItem) error {
	input := &dynamodb.TransactWriteItemsInput{
		TransactItems: transactions,
	}

	_, err := utils.GetDependencies().DbClient.TransactWriteItems(deps.Ctx, input)
	if err != nil {
		log.Print("error while trying to transact write")
		// Check for transaction cancellation reasons
		utils.PrintTransactWriteCancellationReason(err)
		return err
	}

	return nil
}
