package utils

import (
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type DatabaseFormattable interface {
	ApplyPrefixes()
}

func ToDatabaseFormat[T DatabaseFormattable](item T) *map[string]types.AttributeValue {
	item.ApplyPrefixes()
	dbItem, err := attributevalue.MarshalMap(item)
	if err != nil {
		panic("Failed to convert %T to database item")
	}

	return &dbItem
}

func DatabaseItemsToStructs[T any](items []map[string]types.AttributeValue, postProcess func(*T)) *[]T {
	structs := make([]T, 0)
	if err := attributevalue.UnmarshalListOfMaps(items, &structs); err != nil {
		panic(err)
	}

	for index := range structs {
		postProcess(&structs[index])
	}

	return &structs
}

func DatabaseItemToStruct[T any](item map[string]types.AttributeValue, postProcess func(*T)) *T {
	return &(*DatabaseItemsToStructs([]map[string]types.AttributeValue{item}, postProcess))[0]
}
