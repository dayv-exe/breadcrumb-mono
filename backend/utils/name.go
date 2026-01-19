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

	if IsNameBanned(*name) {
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
