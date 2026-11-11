package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"log"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/expression"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

type LocationHelper struct {
	Ctx context.Context
}

func NewLocationHelper(ctx context.Context) *LocationHelper {
	return &LocationHelper{
		Ctx: ctx,
	}
}

func (l *LocationHelper) LogUserNewLocation(coordinate utils.Coordinate) error {
	userLoc := models.NewLocation(coordinate)
	return PutItem(newHelper(l.Ctx, nil), &userLoc)
}

func (l *LocationHelper) UsersCurrentLocationIsValid(coordinate utils.Coordinate) (bool, error) {
	keyCondition := expression.KeyEqual(
		expression.Key("pk"),
		expression.Value(models.UserLocationPkPrefix+utils.GetAuthenticatedUserid()),
	).And(
		expression.KeyBeginsWith(
			expression.Key("sk"),
			models.UserLocationSkPrefix,
		),
	)

	expr, err := expression.NewBuilder().WithKeyCondition(keyCondition).Build()

	if err != nil {
		return false, err
	}

	//
	response, err := QueryItems(
		newHelper(l.Ctx, nil),
		nil,
		nil,
		expr,
		aws.Bool(false),
		aws.Int32(1),
		func(l []map[string]types.AttributeValue) []models.UserLocation {
			if len(l) < 1 {
				return []models.UserLocation{}
			}
			return []models.UserLocation{models.ConvertItemToUserLocation(l[0])}
		},
	)

	if len(response.Items) == 0 {
		// if no known last location
		err := l.LogUserNewLocation(coordinate)
		if err != nil {
			return false, err
		}
		return true, nil
	}

	lastKnownLocation := response.Items[0]

	usersTravelSpeed, err := utils.RequiredSpeed(
		lastKnownLocation.Coordinate,
		coordinate,
		lastKnownLocation.Timestamp,
		utils.GetNormalDateAndTime(),
	)

	if err != nil {
		return false, err
	}

	if usersTravelSpeed.DistanceMeters < constants.MIN_ALLOWED_DISTANCE_OFFSET {
		// if user has not traveled to far since last time
		err := l.LogUserNewLocation(coordinate)
		if err != nil {
			return false, err
		}
		return true, nil
	} else if usersTravelSpeed.MetersPerSecond > constants.MAX_USER_TRAVEL_SPEED_METERS_SECOND {
		// possible location spoofing
		log.Printf("WARNING: Potential spoofing detected. Last know coords: %#v, current coords: %#v, last known ts: %#v, current ts: %#v", lastKnownLocation.Coordinate, coordinate, lastKnownLocation.Timestamp, utils.GetNormalDateAndTime())
		return false, nil
	} else {
		// if location does not seem sus
		err := l.LogUserNewLocation(coordinate)
		if err != nil {
			return false, err
		}
		return true, nil
	}
}
