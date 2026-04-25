package helpers

import (
	"backend/models"
	"backend/utils"
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type userHelper struct {
	Ctx context.Context
}

func NewUserHelper(ctx context.Context) *userHelper {
	return &userHelper{
		Ctx: ctx,
	}
}

func (u *userHelper) sliceTypeConverter(m []map[string]types.AttributeValue) []models.User {
	return *models.ConvertToUsers(m)
}

func (u *userHelper) typeConverter(m map[string]types.AttributeValue) models.User {
	return *models.ConvertToUser(m)
}

func (this *userHelper) AddUser(u *models.User) error {
	var transactions []types.TransactWriteItem

	expr, err := expression.NewBuilder().
		WithCondition(
			expression.AttributeNotExists(
				expression.Name("pk"),
			),
		).
		Build()

	if err != nil {
		return err
	}

	// nickname item to reserve users nickname
	newNickname := models.NewNickname(u.Nickname, u.Userid)

	// put nickname item
	transactions = append(transactions, UsePut(
		newNickname,
		utils.GetDependencies().MainTableName,
		&expr,
	))

	// put user item
	transactions = append(transactions, UsePut(
		u,
		utils.GetDependencies().MainTableName,
		nil,
	))

	// get search index transact write items
	transactions = append(transactions, models.GetUserSearchIndexItems(u)...)

	return TransactWrite(newHelper(this.Ctx, nil), transactions...)
}

func (this *userHelper) findAllWithNickname(nickname string) (*[]models.User, error) {
	keyCondition := expression.KeyEqual(
		expression.Key("gsi"),
		expression.Value(strings.ToLower(nickname)),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(keyCondition).Build()

	if err != nil {
		return nil, err
	}

	result, err := QueryItems(
		newHelper(this.Ctx, nil),
		nil,
		aws.String("GSIndex"),
		expr,
		nil,
		this.sliceTypeConverter,
	)

	if err != nil {
		return nil, err
	}

	return &result.Items, nil
}

func (this *userHelper) FindByNickname(nickname string) (*models.User, error) {
	users, err := this.findAllWithNickname(nickname)
	if err != nil {
		return nil, err
	}

	if users == nil || len((*users)) < 1 {
		return nil, nil
	}

	return &(*users)[0], nil
}

func (this *userHelper) FindById(id string) (*models.User, error) {
	helper := newHelper(this.Ctx, nil)
	return GetAndConvertItem(helper, *models.UserKey(id), nil, this.typeConverter)
}

func (this *userHelper) DeleteFromDynamo(u *models.User) error {
	// delete user profile, nickname, friends, post and allat
	var transactions []types.TransactWriteItem

	transactions = append(transactions, UseDelete(*models.UserKey(u.Userid), utils.GetDependencies().MainTableName))
	transactions = append(transactions, UseDelete(models.NicknameKey(u.Nickname), utils.GetDependencies().MainTableName))
	transactions = append(transactions, models.GetDeleteUserIndexesItems(u)...)
	// end friendships
	// decline all pending requests
	// unsend all f reqs

	return TransactWrite(
		newHelper(this.Ctx, nil),
		transactions...,
	)
}

func (u *userHelper) updateNameOrNickname(user *models.User, newName string, transactions []types.TransactWriteItem, updatingNickname bool) error {
	// get transactions to delete all old search indexes
	err := TransactWrite(newHelper(u.Ctx, nil), models.GetDeleteUserIndexesItems(user)...)

	if err != nil {
		log.Printf("FAILED TO DELETE OLD SEARCH INDEXES. ERROR: %v", err)
		return err
	}

	// update user struct with new details
	attributeName := "fullname"    // hardcoded string
	dateAttr := "last_name_change" // hardcoded string
	if updatingNickname {
		attributeName = "gsi"             // hardcoded string
		dateAttr = "last_nickname_change" // hardcoded string
		user.Nickname = newName
	} else {
		user.Name = newName
	}

	// generate new search indexes based on new name
	transactions = append(transactions, models.GetUserSearchIndexItems(user)...)

	expr, err := expression.NewBuilder().WithUpdate(
		expression.Set(
			expression.Name(attributeName),
			expression.Value(newName),
		).Set(
			expression.Name(dateAttr),
			expression.Value(utils.GetDateNow()),
		),
	).Build()

	if err != nil {
		return err
	}

	// update the actual user item in db
	transactions = append(transactions, UseUpdate(
		*models.UserKey(user.Userid),
		expr,
		utils.GetDependencies().MainTableName,
	))

	// after update completes successfully
	err = TransactWrite(newHelper(u.Ctx, nil), transactions...)
	if err != nil {
		return err
	}

	err = NewQueueHelper(u.Ctx).PutInQueue(WithUpdateFriendsDisplayInfo(user.Userid))
	if err != nil {
		log.Println("ERROR: failed to put action in queue!")
		log.Println(err)
	}
	return nil
}

func (u *userHelper) UpdateNickname(user *models.User, newNickname string) error {
	// check user is not updating nickname too soon
	// if !utils.NameChangeAllowed(user.LastNicknameChange) {
	// 	return fmt.Errorf("Nickname change to soon, try again after a few days")
	// }

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
		models.NicknameKey(user.Nickname),
		utils.GetDependencies().MainTableName,
	))

	// create new nickname reservation and add to transactions
	nicknameReservation := models.NewNickname(newNickname, user.Userid)
	transactions = append(transactions, UsePut(nicknameReservation, utils.GetDependencies().MainTableName, nil))

	return u.updateNameOrNickname(user, newNickname, transactions, true)
}

func (u *userHelper) UpdateName(user *models.User, newName string) error {
	// if !utils.NameChangeAllowed(user.LastNameChange) {
	// 	return fmt.Errorf("name change too soon, wait a few days and try again.")
	// }

	if !utils.NameIsValid(&newName) {
		return fmt.Errorf("%v is an invalid name!", newName)
	}

	var transactions []types.TransactWriteItem
	return u.updateNameOrNickname(user, newName, transactions, false)
}

func (u *userHelper) UpdateBio(userid, bio string) error {
	if !utils.BioIsValid(&bio) {
		return fmt.Errorf("bio provided is invalid, bio: %v", bio)
	}

	expr, err := expression.NewBuilder().WithUpdate(
		expression.Set(
			expression.Name("bio"),
			expression.Value(strings.TrimSpace(bio)),
		),
	).Build()

	if err != nil {
		log.Println("failed to build update expression")
		return err
	}

	return UpdateItem(newHelper(u.Ctx, nil), models.UserKey(userid), expr)
}

func (this *userHelper) NicknameAvailable(nickname string) (bool, error) {
	exists, err := ItemExists(newHelper(this.Ctx, nil), models.NicknameKey(nickname))
	if err != nil {
		return false, err
	}

	return !exists, nil // if not exists return false then flip to true so nickname available
}

func (u *userHelper) UpdateProfilePic(userId string, newProfilePicture models.CrumbMedia) error {
	key := models.UserKey(userId)
	oldProfilePic, _ := u.GetProfilePicKeys(userId)

	s3Helper := NewS3Helper(u.Ctx)

	// TODO: if err then add del operation to queue and try again
	if strings.TrimSpace(oldProfilePic.MediaKey) != "" {
		s3Helper.DeleteObj(oldProfilePic.MediaKey)
	}

	if strings.TrimSpace(oldProfilePic.ThumbnailKey) != "" {
		s3Helper.DeleteObj(oldProfilePic.ThumbnailKey)
	}

	update := expression.Set(
		expression.Name("profilePicture"),
		expression.Value(newProfilePicture),
	)
	expr, err := expression.NewBuilder().WithUpdate(update).Build()
	if err != nil {
		return err
	}

	helper := newHelper(u.Ctx, nil)
	return UpdateItem(helper, key, expr)
}

func (u *userHelper) GetProfilePicKeys(userId string) (models.CrumbMedia, error) {
	keyCond := expression.KeyEqual(
		expression.Key("pk"),
		expression.Value(models.UserPkPrefix+userId),
	).And(
		expression.KeyBeginsWith(
			expression.Key("sk"),
			models.UserSkPrefix,
		),
	)

	proj := expression.NamesList(
		expression.Name("profilePicture"),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(keyCond).WithProjection(proj).Build()
	if err != nil {
		log.Printf("Failed to build key condition ERROR: %v", err)
		return models.CrumbMedia{}, err
	}

	helper := newHelper(u.Ctx, nil)
	result, err := QueryItems(helper, nil, nil, expr, aws.Int32(1), func(m []map[string]types.AttributeValue) []models.CrumbMedia {
		users := models.ConvertToUsers(m)
		keys := make([]models.CrumbMedia, 0)
		for _, user := range *users {
			keys = append(keys, user.ProfilePicture)
		}

		return keys
	})

	return result.Items[0], nil
}
