package utils

import (
	"backend/constants"
	"time"
)

func GetNormalTimeNow() string {
	return time.Now().Format(constants.FULL_DATE_LAYOUT)
}

func GetNormalDateAndTime() string {
	return time.Now().Format(constants.FULL_DATE_TIME_LAYOUT)
}

func GetNormalDateNow() string {
	return time.Now().Format(constants.FULL_DATE_LAYOUT)
}

func GetUnixTimestamp() int64 {
	return time.Now().Unix()
}

func GetOffsetMonthUnixTimestamp(months int) int64 {
	return time.Now().AddDate(0, months, 0).Unix()
}
