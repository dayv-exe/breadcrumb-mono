package helpers

import (
	"backend/models"
	"backend/utils"
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type UserDynamoHelper struct {
	Dependencies *utils.HandlerDependencies
	Ctx          context.Context
}

func NewUserDynamoHelper(deps *UserDynamoHelper, ctx context.Context) *UserDynamoHelper {
	helper = utils.Helper{
		TableName: deps.Dependencies.TableName,
		DbClient:  deps.Dependencies.DbClient,
		Ctx:       ctx,
	}

	return &UserDynamoHelper{
		Dependencies: deps.Dependencies,
		Ctx:          ctx,
	}
}

func (this *UserDynamoHelper) AddUser(u *models.User, searchTableName string) error {
	// create new nickname item, to reserve nickname in race conditions for example
	newNickname := models.NewNickname(u.Nickname, u.Name, u.Userid)

	// create a slice of add new user db transactions
	newUserTransactions := []types.TransactWriteItem{
		{
			// adds nickname item to reserve name
			Put: &types.Put{
				TableName: aws.String(this.Dependencies.TableName),
				Item:      *utils.ToDatabaseFormat(newNickname),
				// if this fails most likely because nickname is already in use
				ConditionExpression: aws.String("attribute_not_exists(pk)"),
			},
		},
		{
			// add user to db
			Put: &types.Put{
				TableName: aws.String(this.Dependencies.TableName),
				Item:      *utils.ToDatabaseFormat(u),
			},
		},
	}

	searchHelper := SearchDynamoHelper{
		Dependencies: this.Dependencies,
		Ctx:          this.Ctx,
	}

	// to create all the search indexes for the new user
	// gets all the transactions to add those search indexes to the database
	searchIndexTransactions, siErr := searchHelper.GetUserSearchIndexItems(u)
	if siErr != nil {
		log.Println("error while creating user search indexes")
		return siErr
	}

	input := &dynamodb.TransactWriteItemsInput{
		TransactItems: append(newUserTransactions, searchIndexTransactions...),
	}

	_, err := this.Dependencies.DbClient.TransactWriteItems(this.Ctx, input)

	if err != nil {
		// Check for transaction cancellation reasons
		utils.PrintTransactWriteCancellationReason(err)
		return err
	}

	return nil
}

func (this *UserDynamoHelper) FindByNickname(nickname string) (*models.User, error) {
	input := &dynamodb.QueryInput{
		TableName:              aws.String(this.Dependencies.TableName),
		IndexName:              aws.String("NicknameIndex"),
		KeyConditionExpression: aws.String("nickname = :nick"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":nick": &types.AttributeValueMemberS{Value: strings.ToLower(nickname)},
		},
		Limit: aws.Int32(1),
	}

	output, err := this.Dependencies.DbClient.Query(this.Ctx, input)

	if err != nil {
		return nil, err
	}

	if output.Count == 0 {
		log.Print("no such user found: " + nickname)
		return nil, nil
	}

	return models.ConvertToUser(output.Items[0]), nil
}

func (this *UserDynamoHelper) FindById(id string) (*models.User, error) {
	input := dynamodb.GetItemInput{
		Key:       models.UserKey(id),
		TableName: &this.Dependencies.TableName,
	}

	output, err := this.Dependencies.DbClient.GetItem(this.Ctx, &input)

	if err != nil {
		return nil, err
	}

	if len(output.Item) == 0 {
		log.Print("no such user found: " + id)
		return nil, nil
	}

	return models.ConvertToUser(output.Item), nil
}

func (this *UserDynamoHelper) DeleteFromDynamo(u *models.User, searchTableName string) error {
	// delete user profile, nickname, friends, post and allat

	// transactions to remove user item and nickname reservation item from db
	deleteUserTransactions := []types.TransactWriteItem{
		{
			// delete account metadata
			Delete: &types.Delete{
				Key:       models.UserKey(u.Userid),
				TableName: aws.String(this.Dependencies.TableName),
			},
		},
		{
			// delete nickname reservation
			Delete: &types.Delete{
				Key:       models.NicknameKey(u.Nickname),
				TableName: aws.String(this.Dependencies.TableName),
			},
		},
	}

	searchHelper := SearchDynamoHelper{
		Dependencies: this.Dependencies,
		Ctx:          this.Ctx,
	}
	// transactions to remove all users search indexes from search table
	searchIndexTransactions, siErr := searchHelper.GetDeleteUserIndexesItems(u)
	if siErr != nil {
		log.Println("error while creating user search indexes")
		return siErr
	}

	input := &dynamodb.TransactWriteItemsInput{
		TransactItems: append(deleteUserTransactions, searchIndexTransactions...),
	}

	_, err := this.Dependencies.DbClient.TransactWriteItems(this.Ctx, input)

	if err != nil {
		utils.PrintTransactWriteCancellationReason(err)
		return err
	}

	return nil
}

func (this *UserDynamoHelper) UpdateName(user *models.User, newName string, updateNickname bool, searchTableName string) error {
	attributeToUpdate := "name"
	// check if the new name is valid
	if !updateNickname {
		// if we are updating name
		if !utils.NameIsValid(&newName) {
			log.Println("New name given to update name in dynamo helper is invalid")
			return fmt.Errorf("New name provided is invalid!")
		}
	}

	if updateNickname {
		// if we are updating nickname
		attributeToUpdate = "nickname"
		nnAvailable, nnaErr := this.NicknameAvailable(newName)
		if nnaErr != nil {
			// if we are unable to determine if new nickname is available
			log.Println("error while trying to determine if new nickname is available")
			return nnaErr
		}
		// if new nickname is not available
		if !utils.NicknameValid(user.Nickname) || !nnAvailable {
			log.Println("New name given to update nickname in dynamo helper is invalid")
			return fmt.Errorf("New nickname provided is invalid!")
		}
	}

	// will hold all the transactions that need to be carried out to complete the name change
	var transactItems []types.TransactWriteItem

	searchHelper := SearchDynamoHelper{
		Dependencies: this.Dependencies,
		Ctx:          this.Ctx,
	}

	// get the search indexes of the old name, and puts them all in delete transactions
	indexes, siErr := searchHelper.GetDeleteUserIndexesItems(user)

	if siErr != nil {
		// if an error occurred while trying to get user indexes to delete
		return siErr
	}

	// add them to our transaction slice
	transactItems = append(transactItems, indexes...)

	// create search indexes for the new name, and put them in put transactions
	if !updateNickname {
		user.Name = newName // we can update the user name here after we delete the indexes with the old name
	} else {
		user.Nickname = newName // we can update the user nickname here after we delete the indexes with the old nickname
	}
	indexes, siErr = searchHelper.GetUserSearchIndexItems(user)
	if siErr != nil {
		// if an error occurred while trying to get user indexes to delete
		return siErr
	}

	// add the new name transactions to our transaction slice
	transactItems = append(transactItems, indexes...)

	// the transaction to actually update the name
	userItems := types.TransactWriteItem{
		Update: &types.Update{
			Key:              models.UserKey(user.Userid),
			TableName:        aws.String(this.Dependencies.TableName),
			UpdateExpression: aws.String(fmt.Sprintf("SET %s = :n", attributeToUpdate)),
			ExpressionAttributeValues: map[string]types.AttributeValue{
				":n": &types.AttributeValueMemberS{Value: newName},
			},
		},
	}

	// add the name update transaction to the transaction slice
	transactItems = append(transactItems, userItems)

	input := &dynamodb.TransactWriteItemsInput{
		TransactItems: transactItems,
	}

	_, updateErr := this.Dependencies.DbClient.TransactWriteItems(this.Ctx, input)
	if updateErr != nil {
		log.Println("Something went wrong while trying to update name")
		utils.PrintTransactWriteCancellationReason(updateErr)
		return updateErr
	}

	return nil
}

func (this *UserDynamoHelper) updateAttribute(attributeName string, key map[string]types.AttributeValue, newAttribute types.AttributeValue) error {
	input := &dynamodb.UpdateItemInput{
		Key:                 key,
		TableName:           &this.Dependencies.TableName,
		ConditionExpression: aws.String(fmt.Sprintf("SET %s = :s", attributeName)),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":s": newAttribute,
		},
	}

	_, err := this.Dependencies.DbClient.UpdateItem(this.Ctx, input)
	if err != nil {
		log.Print("An error occurred while trying to update attribute")
		return err
	}

	return nil
}

func (this *UserDynamoHelper) UpdateBio(userId string, bio string) error {
	if !utils.BioIsValid(&bio) {
		log.Println("new bio given to update bio function is invalid")
		return fmt.Errorf("Bio invalid!")
	}

	key := models.UserKey(userId)
	val := &types.AttributeValueMemberS{Value: bio}

	return this.updateAttribute("bio", key, val)
}

func (this *UserDynamoHelper) UpdateDpUrl(userId string, url string) error {
	return nil
}

func (this *UserDynamoHelper) NicknameAvailable(nickname string) (bool, error) {
	input := dynamodb.GetItemInput{
		Key:       models.NicknameKey(nickname),
		TableName: aws.String(this.Dependencies.TableName),
	}

	return nicknameAvailableQueryRunner(func() (*dynamodb.GetItemOutput, error) {
		return this.Dependencies.DbClient.GetItem(this.Ctx, &input)
	})
}

func nicknameAvailableQueryRunner(queryFn func() (*dynamodb.GetItemOutput, error)) (bool, error) {
	result, err := queryFn()

	if err != nil {
		return false, err
	}

	isAvailable := result.Item == nil
	return isAvailable, nil
}
