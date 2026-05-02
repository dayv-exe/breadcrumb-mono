package utils

import (
	"backend/constants"
	"strings"
	"time"
)

func NameIsValid(name *string) bool {
	if len(*name) > constants.MAX_FULLNAME_CHARS {
		return false
	}

	if IsNameBanned(*name) {
		return false
	}

	return true
}

func NameChangeAllowed(lastChangedOn int64) bool {
	// if never changed (0 or invalid)
	if lastChangedOn == 0 {
		return true
	}

	// convert unix timestamp → time
	lastChangeDate := time.Unix(lastChangedOn, 0).UTC()

	// apply delay (days)
	changeUnfreezeDate := lastChangeDate.AddDate(0, 0, constants.NAME_CHANGE_DELAY)

	return time.Now().UTC().After(changeUnfreezeDate)
}

func IsNameBanned(name string) bool {
	if len(name) < 1 {
		return false
	}

	name = strings.ToLower(name)

	_, exists := constants.BannedTerms[name]
	if exists {
		return true
	}

	isBanned := false
	susCount := 0

	for banned, hardBan := range constants.BannedTerms {
		bannedStr, susStr := getBannedSubStr(name, banned, hardBan)

		if susStr != "" {
			susCount++
			name = strings.ReplaceAll(name, susStr, "")
		}

		if bannedStr != "" {
			isBanned = true
			break
		}

		if name == "" || susCount > 1 {
			break
		}
	}

	return isBanned || susCount > 1
}
