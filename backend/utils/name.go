package utils

import (
	"backend/constants"
	"log"
	"strings"
	"time"
)

func NameIsValid(name *string) bool {
	return len(*name) == 0 || len(*name) <= constants.MAX_FULLNAME_CHARS
}

func NameChangeAllowed(lastChangedOn string) bool {
	// format is yyyy/mm/dd
	if strings.TrimSpace(lastChangedOn) == "" {
		return true
	}

	lastChangeDate, err := time.Parse(constants.FULL_DATE_LAYOUT, lastChangedOn)
	if err != nil {
		log.Fatalf("Failed to parse last name change date %v", err)
	}

	changeUnfreezeDate := lastChangeDate.AddDate(0, 0, constants.NAME_CHANGE_DELAY)
	lastChangeDate.Add(time.Hour)
	if time.Now().After(changeUnfreezeDate) {
		return true
	}

	return false
}
