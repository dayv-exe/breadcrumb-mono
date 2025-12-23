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

	if GetNameSuspicionPercentage(*name) == 100 {
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

func GetNameSuspicionPercentage(name string) float64 {
	normalizedInput := removeEverythingExceptValidChars(strings.ToLower(name))
	if len(normalizedInput) < 1 {
		return 0.0
	}

	matchPct := 0.0
	n := len(normalizedInput)
	for banned := range constants.BannedTerms {
		for i := 0; i < n; i++ {
			if n-i < len(banned) {
				break
			}
			matchPct = max(matchPct, bannedWordMatch(normalizedInput[i:], banned))
		}

		if matchPct == 100 {
			break
		}
	}

	return matchPct
}
