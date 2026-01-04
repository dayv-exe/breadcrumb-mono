package utils

import (
	"backend/constants"
	"testing"
	"time"
	"unicode"
)

func TestIsNicknameValid(t *testing.T) {
	tests := []struct {
		nickname string
		valid    bool
	}{
		{"john_doe", true},
		{"_john", false},
		{"john..doe", false},
		{"j", false},
		{"averylongnamethatshouldfail", false},
		{"john.doe_", false},
		{"john__doe", false},
		{"j.doe", true},
		{"j_doe", true},
		{"JohnDoe99", true},
		{"john_.doe", false},
		{"john.doe_", false},
		{".johndoe", false},
		{"4ksf_sqmd1", true},
		{"john.doe001234ed", false},
		{"14792384913", false},
		{"a.1", false},
		{"ab.1", true},
		{"hot.chick69", false},
	}

	for _, tt := range tests {
		t.Run(tt.nickname, func(t *testing.T) {
			got := NicknameValid(tt.nickname)
			if got != tt.valid {
				t.Errorf("isNicknameValid(%q) = %v; want %v", tt.nickname, got, tt.valid)
			}
		})
	}
}

func TestNameChangeAllowed(t *testing.T) {
	tests := []struct {
		name              string
		lastChangeDate    string
		expectAllowChange bool
	}{
		{
			// dd/mm/yyyy
			name:              "last changed a day ago",
			lastChangeDate:    time.Now().AddDate(0, 0, -1).Format(constants.FULL_DATE_LAYOUT),
			expectAllowChange: false,
		},
		{
			// dd/mm/yyyy
			name:              "last changed 2 years ago",
			lastChangeDate:    time.Now().AddDate(-2, 0, 0).Format(constants.FULL_DATE_LAYOUT),
			expectAllowChange: true,
		},
		{
			// dd/mm/yyyy
			name:              "last changed 0 days ago",
			lastChangeDate:    time.Now().AddDate(0, 0, 0).Format(constants.FULL_DATE_LAYOUT),
			expectAllowChange: false,
		},
		{
			// dd/mm/yyyy
			name:              "last changed 31 days ago",
			lastChangeDate:    time.Now().AddDate(0, 0, -31).Format(constants.FULL_DATE_LAYOUT),
			expectAllowChange: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := NameChangeAllowed(tt.lastChangeDate)
			if result != tt.expectAllowChange {
				t.Errorf("Expected %v but got %v instead!", tt.expectAllowChange, result)
			}
		})
	}
}

func TestSuspiciousNamePct(t *testing.T) {
	tests := []struct {
		name           string
		containsBanned bool
	}{
		{
			name:           "pleaseifuckingneedthis",
			containsBanned: true,
		},
		{
			name:           "pleaseiffffuckingggggneedthis",
			containsBanned: true,
		},
		{
			name:           "ireallyreallyhateb00bs",
			containsBanned: true,
		},
		{
			name:           "barrack_obama",
			containsBanned: false,
		},
		{
			name:           "mitch",
			containsBanned: false,
		},
		{
			name:           "m1tch",
			containsBanned: false,
		},
		{
			name:           "btch1",
			containsBanned: false,
		},
		{
			name:           "f*ck123",
			containsBanned: true,
		},
		{
			name:           "f*ck",
			containsBanned: true,
		},
		{
			name:           "assistance",
			containsBanned: false,
		},
		{
			name:           "bass",
			containsBanned: false,
		},
		{
			name:           "cccrumbbb",
			containsBanned: true,
		},
		{
			name:           "cccccrumbbb",
			containsBanned: true,
		},
		{
			name:           "crumbbbbb",
			containsBanned: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := IsNameBanned(tt.name)
			if result != tt.containsBanned {
				t.Errorf("Expected result for %v to be %v but result is %v", tt.name, tt.containsBanned, result)
			}
		})
	}
}

func TestNameBanned(t *testing.T) {
	tests := []struct {
		name           string
		testBannedWord string
		isBanned       bool
	}{
		{
			name:           "assistant",
			testBannedWord: "ass",
			isBanned:       false,
		},
		{
			name:           "damn",
			testBannedWord: "damn",
			isBanned:       true,
		},
		{
			name:           "d*mn",
			testBannedWord: "damn",
			isBanned:       true,
		},
		{
			name:           "bass",
			testBannedWord: "ass",
			isBanned:       false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			banned, sus := getBannedSubStr(tt.name, tt.testBannedWord, false)
			result := banned != ""
			if result != tt.isBanned {
				t.Errorf("expected %v banned state to be %v but got %v instead\nbanned: %v\nsus: %v", tt.name, tt.isBanned, result, banned, sus)
			}
		})
	}
}

func TestAscii(t *testing.T) {
	if unicode.IsLetter(rune('*')) {
		t.Errorf("is letter actually!")
	}
}
