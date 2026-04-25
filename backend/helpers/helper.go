package helpers

import (
	"backend/utils"
	"context"
	"errors"
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

type listResponse[T any] struct {
	Items       []T
	LastEvalKey map[string]types.AttributeValue
}

type sliceConversionFunc[T any] func([]map[string]types.AttributeValue) []T
type conversionFunc[T any] func(map[string]types.AttributeValue) T

// PageResult is the shape returned by a paginated query.
type PageResult[S any] struct {
	Items       []S
	LastEvalKey map[string]types.AttributeValue
}

// PageFetcher fetches one page of items of type S, starting from startKey.
type PageFetcher[S any] func(startKey *map[string]types.AttributeValue) (*PageResult[S], error)

// WriteBuilder converts a single source item into a DynamoDB WriteRequest
// (Put, Delete, etc).
type WriteBuilder[S any] func(item S) types.WriteRequest

func newHelper(ctx context.Context, tableName *string) *helper {
	if tableName == nil {
		tableName = &utils.GetDependencies().MainTableName
	}
	return &helper{
		TableName: *tableName,
		Ctx:       ctx,
	}
}

// PaginateAndBatchWrite walks every page produced by fetchPage, builds a write
// request per item via buildWrite, and flushes them with BatchWriteItems.
func PaginateAndBatchWrite[S any](
	helper *helper,
	fetchPage PageFetcher[S],
	buildWrite WriteBuilder[S],
) error {
	var lastEvalKey map[string]types.AttributeValue

	for {
		result, err := fetchPage(&lastEvalKey)
		if err != nil {
			log.Println("failed to fetch page")
			return err
		}

		if len(result.Items) > 0 {
			updates := make([]types.WriteRequest, 0, len(result.Items))
			for _, item := range result.Items {
				updates = append(updates, buildWrite(item))
			}
			if err := BatchWriteItems(helper, updates...); err != nil {
				log.Println("failed to batch write items")
				// return err
			}
		}

		if result.LastEvalKey == nil {
			break
		}
		lastEvalKey = result.LastEvalKey
	}

	return nil
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
	var ccf *types.ConditionalCheckFailedException
	if errors.As(err, &ccf) {
		return nil
	}
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

func getItem(deps *helper, key *map[string]types.AttributeValue, expression *expression.Expression) (*dynamodb.GetItemOutput, error) {
	input := &dynamodb.GetItemInput{
		Key:                      *key,
		TableName:                &deps.TableName,
		ProjectionExpression:     expression.Projection(),
		ExpressionAttributeNames: expression.Names(),
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
	output, err := getItem(deps, &key, nil)
	if err != nil {
		return false, err
	}

	return len(output.Item) > 0, nil
}

func GetAndConvertItem[T any](deps *helper, key map[string]types.AttributeValue, expression *expression.Expression, convertToStruct conversionFunc[T]) (*T, error) {
	output, err := getItem(deps, &key, expression)
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

func QueryAllItems[T any](deps *helper, indexName *string, expression expression.Expression, convertToStructs sliceConversionFunc[T]) (*[]T, error) {
	input := &dynamodb.QueryInput{
		TableName:                 &deps.TableName,
		KeyConditionExpression:    expression.KeyCondition(),
		ExpressionAttributeNames:  expression.Names(),
		ExpressionAttributeValues: expression.Values(),
	}

	if indexName != nil {
		input.IndexName = indexName
	}

	var allItems []map[string]types.AttributeValue
	var lastEvaluatedKey map[string]types.AttributeValue

	for {
		if lastEvaluatedKey != nil {
			input.ExclusiveStartKey = lastEvaluatedKey
		}

		result, err := utils.GetDependencies().DbClient.Query(deps.Ctx, input)

		if err != nil {
			log.Print("an error occurred while trying to query")
			return nil, err
		}

		allItems = append(allItems, result.Items...)

		if result.LastEvaluatedKey == nil {
			break
		}

		lastEvaluatedKey = result.LastEvaluatedKey
	}

	items := make([]T, 0)
	items = append(items, convertToStructs(allItems)...)

	return &items, nil
}

type queryResult[T any] struct {
	Items            []T
	LastEvaluatedKey map[string]types.AttributeValue
}

func QueryItems[T any](deps *helper, lastEvaluatedKey *map[string]types.AttributeValue, indexName *string, expression expression.Expression, limit *int32, convertToStructs sliceConversionFunc[T]) (*queryResult[T], error) {

	input := &dynamodb.QueryInput{
		TableName: &deps.TableName,
		Limit:     limit,
	}

	if expression.KeyCondition() != nil {
		input.KeyConditionExpression = expression.KeyCondition()
	}

	if expression.Names() != nil {
		input.ExpressionAttributeNames = expression.Names()
	}

	if expression.Values() != nil {
		input.ExpressionAttributeValues = expression.Values()
	}

	if expression.Filter() != nil {
		input.FilterExpression = expression.Filter()
	}

	if expression.Projection() != nil {
		input.ProjectionExpression = expression.Projection()
	}

	if indexName != nil {
		input.IndexName = indexName
	}

	if lastEvaluatedKey != nil {
		input.ExclusiveStartKey = *lastEvaluatedKey
	}

	result, err := utils.GetDependencies().DbClient.Query(deps.Ctx, input)
	if err != nil {
		return nil, err
	}

	items := make([]T, 0)
	items = append(items, convertToStructs(result.Items)...)

	return &queryResult[T]{
		Items:            items,
		LastEvaluatedKey: result.LastEvaluatedKey,
	}, nil
}

func BatchGetItems[T any](deps *helper, convertToStructs sliceConversionFunc[T], keys ...map[string]types.AttributeValue) ([]T, error) {
	context, cancel := context.WithTimeout(deps.Ctx, 10*time.Second)
	defer cancel()

	const chunkSize = 100

	const maxAttempts = 10
	const baseBackOff = 50 * time.Millisecond
	const maxJitter = 50 * time.Millisecond

	rng := rand.New(rand.NewSource(time.Now().UnixNano()))

	results := make([]T, 0, len(keys))

	for i := 0; i < len(keys); i += chunkSize {
		end := i + chunkSize
		if end > len(keys) {
			end = len(keys)
		}

		unprocessed := map[string]types.KeysAndAttributes{
			deps.TableName: {Keys: keys[i:end]},
		}

		for attempt := 0; attempt < maxAttempts && len(unprocessed) > 0; attempt++ {
			if err := context.Err(); err != nil {
				return nil, fmt.Errorf("batch get aborted (context): %w", err)
			}

			input := &dynamodb.BatchGetItemInput{
				RequestItems: unprocessed,
			}

			out, err := utils.GetDependencies().DbClient.BatchGetItem(context, input)
			if err != nil {
				return nil, fmt.Errorf("batch get from %s failed (chunk %d-%d, attempt %d/%d): %w",
					deps.TableName, i, end-1, attempt+1, maxAttempts, err)
			}

			if items, ok := out.Responses[deps.TableName]; ok && len(items) > 0 {
				batch := convertToStructs(items)
				results = append(results, batch...)
			}

			unprocessed = out.UnprocessedKeys
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
				return nil, fmt.Errorf("batch get aborted during backoff: %w", context.Err())
			case <-timer.C:
			}
		}

		if len(unprocessed) > 0 {
			remaining := 0
			if v, ok := unprocessed[deps.TableName]; ok {
				remaining = len(v.Keys)
			}
			return nil, fmt.Errorf("batch get incomplete for %s (chunk %d-%d): %d unprocessed after %d attempts",
				deps.TableName, i, end-1, remaining, maxAttempts)
		}
	}

	return results, nil
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

func UsePut[T utils.DatabaseFormattable](item T, tableName string, cond *expression.Expression) types.TransactWriteItem {
	put := &types.Put{
		Item:      *utils.ToDatabaseFormat(item),
		TableName: &tableName,
	}

	if cond != nil {
		put.ConditionExpression = cond.Condition()
		put.ExpressionAttributeNames = cond.Names()
		put.ExpressionAttributeValues = cond.Values()
	}

	return types.TransactWriteItem{Put: put}
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
