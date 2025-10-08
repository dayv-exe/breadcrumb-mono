package utils

import (
	"backend/constants"
	"time"
)

func GetTimeNow() string {
	return time.Now().Format(constants.FULL_DATE_TIME_LAYOUT)
}
