package utils

import (
	"backend/constants"
	"log"
	"strings"
	"time"
)

func NameIsValid(name *string) bool {
	if len(*name) > constants.MAX_FULLNAME_CHARS {
		return false
	}

	if NameIsBanned(*name) {
		return false
	}

	return true
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

func NameIsBanned(name string) bool {
	normalizedInput := removeEverythingExceptValidChars(strings.ToLower(name))
	if len(normalizedInput) < 1 {
		return false
	}

	isBanned := false
	n := len(normalizedInput)
	for banned := range constants.BannedTerms {
		for i := 0; i < n; i++ {
			if n-i < len(banned) {
				break
			}

			if isBannedInput(normalizedInput[i:], banned) {
				isBanned = true
				break
			}
		}
	}

	return isBanned
}
