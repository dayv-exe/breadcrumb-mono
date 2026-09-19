package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"golang.org/x/sync/errgroup"
)

type friendshipHelper struct {
	Ctx context.Context
}

func NewFriendshipHelper(ctx context.Context) *friendshipHelper {
	return &friendshipHelper{
		Ctx: ctx,
	}
}

func (f *friendshipHelper) getLastFriendshipState(user1, user2 string) (*models.Friendship, error) {
	keyCond := expression.KeyEqual(
		expression.Key("gsi"),
		expression.Value(models.FriendshipPkPrefix+user1),
	).And(
		expression.KeyBeginsWith(
			expression.Key("gsiSk"),
			models.FriendshipFriendIdPrefix+user2+models.FriendshipTimestampPrefix,
		),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(keyCond).Build()
	if err != nil {
		return nil, err
	}

	result, err := QueryItems(
		newHelper(f.Ctx, nil),
		nil,
		aws.String("GSIndex"),
		expr,
		nil,
		aws.Int32(1),
		func(items []map[string]types.AttributeValue) []models.Friendship {
			return *models.ConvertDbItemsToFriendshipStructs(items)
		},
	)
	if err != nil {
		return nil, err
	}

	if len(result.Items) == 0 {
		return nil, nil
	}

	return &result.Items[0], nil
}

type preUpdateFriendshipState struct {
	DeleteTransactions  []types.TransactWriteItem
	FriendshipCreatedAt int64
}

func (f *friendshipHelper) getOldFriendshipItemDeleteTransactions(user1, user2 string) (*preUpdateFriendshipState, error) {
	var oldFriendshipItem1, oldFriendshipItem2 *models.Friendship
	g, _ := errgroup.WithContext(f.Ctx)

	g.Go(func() error {
		s, err := f.getLastFriendshipState(user1, user2)
		if err != nil {
			return fmt.Errorf("ERROR: failed to get last state (%s->%s): %w",
				user1, user2, err)
		}
		oldFriendshipItem1 = s
		return nil
	})
	g.Go(func() error {
		s, err := f.getLastFriendshipState(user2, user1)
		if err != nil {
			return fmt.Errorf("ERROR: failed to get last state (%s->%s): %w",
				user2, user1, err)
		}
		oldFriendshipItem2 = s
		return nil
	})
	if err := g.Wait(); err != nil {
		return nil, err
	}

	tableName := utils.GetDependencies().MainTableName

	if oldFriendshipItem1 == nil || oldFriendshipItem2 == nil {
		return nil, nil
	}

	createdAt := oldFriendshipItem1.CreatedAt

	if oldFriendshipItem1.Status != constants.FRIENDSHIP_STATUS_ACTIVE {
		createdAt = time.Now().Unix()
	}

	return &preUpdateFriendshipState{
		DeleteTransactions: []types.TransactWriteItem{
			UseDelete(oldFriendshipItem1.GetKey(), tableName),
			UseDelete(oldFriendshipItem2.GetKey(), tableName),
		},
		FriendshipCreatedAt: createdAt,
	}, nil
}

func (f *friendshipHelper) PutFriendship(currentUser, otherUser models.User) error {
	userid := utils.GetAuthenticatedUserid()
	if userid != currentUser.Userid {
		return fmt.Errorf("Userid mismatch!")
	}

	// old friendship items if users are already friends
	oldFriendshipState, err := f.getOldFriendshipItemDeleteTransactions(currentUser.Userid, otherUser.Userid)
	if err != nil {
		return err
	}

	transactions := make([]types.TransactWriteItem, 4)

	createdAt := time.Now().Unix()
	if oldFriendshipState != nil {
		createdAt = oldFriendshipState.FriendshipCreatedAt
		transactions = append(transactions, oldFriendshipState.DeleteTransactions...)
	}

	tableName := utils.GetDependencies().MainTableName
	friendshipItem1, friendshipItem2 := models.NewFriendship(currentUser, otherUser, createdAt)

	transactions = append(transactions,
		UsePut(friendshipItem1, tableName, nil),
		UsePut(friendshipItem2, tableName, nil),
	)

	return TransactWrite(
		newHelper(f.Ctx, nil),
		transactions...,
	)
}

func (f *friendshipHelper) UsersAreFriends(otherUserid string) (bool, error) {
	userid := utils.GetAuthenticatedUserid()

	keyCondition := expression.KeyEqual(
		expression.Key("gsi"),
		expression.Value(models.FriendshipPkPrefix+userid),
	).And(
		expression.KeyBeginsWith(
			expression.Key("gsiSk"),
			models.FriendshipFriendIdPrefix+otherUserid,
		),
	)

	projection := expression.NamesList(
		expression.Name("status"),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(keyCondition).WithProjection(projection).Build()
	if err != nil {
		return false, err
	}

	response, err := QueryItems(
		newHelper(f.Ctx, nil),
		nil,
		aws.String("GSIndex"),
		expr,
		aws.Bool(false),
		aws.Int32(1),
		func(items []map[string]types.AttributeValue) []models.Friendship {
			return *models.ConvertDbItemsToFriendshipStructs(items)
		},
	)
	if err != nil {
		return false, err
	}

	return len(response.Items) > 0 && response.Items[0].Status == constants.FRIENDSHIP_STATUS_ACTIVE, nil
}

type LatestFriendshipResponse struct {
	Friendships      []models.Friendship
	LastEvaluatedKey map[string]types.AttributeValue
}

func (f *friendshipHelper) GetLatestFriendships(friendId string, timestamp int64) (*LatestFriendshipResponse, error) {
	userid := utils.GetAuthenticatedUserid()

	pkVal := models.FriendshipPkPrefix + userid
	skVal := models.FriendshipTimestampPrefix + fmt.Sprint(timestamp) + models.FriendshipFriendIdPrefix + friendId

	var lastEvalKey *map[string]types.AttributeValue = nil

	if strings.TrimSpace(friendId) != "" && timestamp != 0 {
		lastEvalKey = &map[string]types.AttributeValue{
			"pk": &types.AttributeValueMemberS{Value: pkVal},
			"sk": &types.AttributeValueMemberS{Value: skVal},
		}
	}

	keyCondition := expression.KeyEqual(
		expression.Key("pk"),
		expression.Value(pkVal),
	).And(
		expression.KeyBeginsWith(
			expression.Key("sk"),
			skVal,
		),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(keyCondition).Build()
	if err != nil {
		return nil, err
	}

	result, err := QueryItems(
		newHelper(f.Ctx, nil),
		lastEvalKey,
		nil,
		expr,
		aws.Bool(false),
		nil,
		func(items []map[string]types.AttributeValue) []models.Friendship {
			return *models.ConvertDbItemsToFriendshipStructs(items)
		},
	)
	if err != nil {
		return nil, err
	}

	return &LatestFriendshipResponse{
		Friendships:      result.Items,
		LastEvaluatedKey: result.LastEvaluatedKey,
	}, nil
}

func (f *friendshipHelper) EndFriendship(currentUser, otherUser models.User) error {
	tableName := utils.GetDependencies().MainTableName
	friendshipItem1, friendshipItem2 := models.NewFriendship(currentUser, otherUser, 0)

	friendshipItem1.Status = constants.FRIENDSHIP_STATUS_ENDED
	friendshipItem2.Status = constants.FRIENDSHIP_STATUS_ENDED

	return TransactWrite(
		newHelper(f.Ctx, nil),
		UsePut(friendshipItem1, tableName, nil),
		UsePut(friendshipItem2, tableName, nil),
	)
}
