package helpers

import (
	"backend/models"
	"backend/utils"
	"context"
	"fmt"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type userDynamoHelper struct {
	Ctx context.Context
}

func NewUserHelper(ctx context.Context) *userDynamoHelper {
	return &userDynamoHelper{
		Ctx: ctx,
	}
}

func (this *userDynamoHelper) AddUser(u *models.User) error {
	var transactions []types.TransactWriteItem

	// nickname item to reserve users nickname
	newNickname := models.NewNickname(u.Nickname, u.Userid)

	// put nickname item
	transactions = append(transactions, UsePut(
		newNickname,
		utils.HandlerDependencies.MainTableName,
		aws.String("attribute_not_exists(pk)"),
	))

	// put user item
	transactions = append(transactions, UsePut(
		u,
		utils.HandlerDependencies.MainTableName,
		nil,
	))

	// get search index transact write items
	transactions = append(transactions, models.GetUserSearchIndexItems(u)...)

	return TransactWrite(NewHelper(this.Ctx, nil), transactions...)
}

func (this *userDynamoHelper) findAllWithNickname(nickname string) (*[]models.User, error) {
	return QueryItems(
		NewHelper(this.Ctx, nil),
		aws.String("NicknameIndex"),
		"nickname = :nick",
		map[string]types.AttributeValue{
			":nick": &types.AttributeValueMemberS{Value: strings.ToLower(nickname)},
		},
		func(m []map[string]types.AttributeValue) []models.User {
			return *models.ConvertToUsers(m)
		},
	)
}

func (this *userDynamoHelper) FindByNickname(nickname string) (*models.User, error) {
	users, err := this.findAllWithNickname(nickname)
	if err != nil {
		return nil, err
	}

	return &(*users)[0], nil
}

func (this *userDynamoHelper) FindById(id string) (*models.User, error) {
	helper := NewHelper(this.Ctx, nil)
	return GetAndConvertItem(helper, models.UserKey(id), func(m map[string]types.AttributeValue) models.User {
		return *models.ConvertToUser(m)
	})
}

func (this *userDynamoHelper) DeleteFromDynamo(u *models.User) error {
	// delete user profile, nickname, friends, post and allat
	var transactions []types.TransactWriteItem

	transactions = append(transactions, UseDelete(models.UserKey(u.Userid), utils.HandlerDependencies.MainTableName))
	transactions = append(transactions, UseDelete(models.NicknameKey(u.Nickname), utils.HandlerDependencies.MainTableName))
	transactions = append(transactions, models.GetDeleteUserIndexesItems(u)...)

	return TransactWrite(
		NewHelper(this.Ctx, nil),
		transactions...,
	)
}

func (u *userDynamoHelper) updateNameOrNickname(user *models.User, newName string, transactions []types.TransactWriteItem, updatingNickname bool) error {
	// get transactions to delete all old search indexes
	transactions = append(transactions, models.GetDeleteUserIndexesItems(user)...)

	target := "name"
	// update user struct
	if updatingNickname {
		target = "nickname"
		user.Nickname = newName
	} else {
		user.Name = newName
	}

	// generate new search indexes based on new name
	transactions = append(transactions, models.GetUserSearchIndexItems(user)...)

	// update the actual user item in db
	transactions = append(transactions, UseUpdate(
		models.UserKey(user.Userid),
		fmt.Sprintf("SET %s = :n", target),
		map[string]types.AttributeValue{
			":n": &types.AttributeValueMemberS{Value: newName},
		},
		utils.HandlerDependencies.MainTableName,
	))

	return TransactWrite(NewHelper(u.Ctx, nil), transactions...)
}

func (u *userDynamoHelper) UpdateNickname(user *models.User, newNickname string) error {
	oldNickname := user.Nickname

	// check user is not updating nickname too soon
	if !utils.NameChangeAllowed(user.LastNicknameChange) {
		return fmt.Errorf("Nickname change to soon, try again after a few days")
	}

	// check that nickname is valid
	if !utils.NicknameValid(newNickname) {
		return fmt.Errorf("Nickname provided %v is invalid", newNickname)
	}

	// check that nickname is available
	nicknameAvailable, err := u.NicknameAvailable(newNickname)
	if err != nil {
		return err
	}
	if !nicknameAvailable {
		return fmt.Errorf("%v is already in use!", newNickname)
	}

	var transactions []types.TransactWriteItem

	// delete old nickname reservations
	transactions = append(transactions, UseDelete(
		models.NicknameKey(oldNickname),
		utils.HandlerDependencies.MainTableName,
	))

	// create new nickname reservation and add to transactions
	nicknameReservation := models.NewNickname(newNickname, user.Userid)
	transactions = append(transactions, UsePut(nicknameReservation, utils.HandlerDependencies.MainTableName, nil))

	return u.updateNameOrNickname(user, newNickname, transactions, true)
}

func (u *userDynamoHelper) UpdateName(user *models.User, newName string) error {
	var transactions []types.TransactWriteItem
	return u.updateNameOrNickname(user, newName, transactions, false)
}

func (this *userDynamoHelper) NicknameAvailable(nickname string) (bool, error) {
	exists, err := ItemExists(NewHelper(this.Ctx, nil), models.NicknameKey(nickname))
	if err != nil {
		return false, err
	}

	return !exists, nil // if not exists return false then flip to true so nickname available
}
