package helpers

import (
	"backend/constants"
	"backend/models"
	"backend/utils"
	"context"
	"log"
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
	userid := utils.GetAuthenticatedUserid()

	response, err := getItem(
		newHelper(l.Ctx, nil),
		models.UserLocationKey(userid),
		nil,
	)

	if len(response.Item) == 0 {
		// if no known last location
		err := l.LogUserNewLocation(coordinate)
		if err != nil {
			return false, err
		}
		return true, nil
	}

	lastKnownLocation := models.ConvertItemToUserLocation(response.Item)

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
