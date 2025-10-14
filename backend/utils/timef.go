package utils

import (
	"backend/constants"
	"time"
)

func GetTimeNow() string {
	return time.Now().Format(constants.FULL_DATE_TIME_LAYOUT)
}

func GetDateNow() string {
	return time.Now().Format(constants.BIRTHDATE_ONLY_DATE_LAYOUT)
}
