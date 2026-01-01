package utils

import (
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
)

var asciiLettersOnly = regexp.MustCompile(`^[A-Za-z]+$`)

func IsASCIILettersOnly(s string) bool {
	return asciiLettersOnly.MatchString(s)
}

// remove diacritics (è → e, ç → c, etc.)
func removeDiacritics(s string) string {
	t := transform.Chain(
		norm.NFD,
		runes.Remove(runes.In(unicode.Mn)),
		norm.NFC,
	)
	result, _, _ := transform.String(t, s)
	return strings.TrimSpace(result)
}

// remove emojis and other symbols
func removeEverythingExceptValidChars(s string) string {
	re := regexp.MustCompile(`[^a-zA-Z0-9]+`)
	s = re.ReplaceAllString(s, " ")

	reSpaces := regexp.MustCompile(`\s+`)
	s = reSpaces.ReplaceAllString(s, " ")

	return strings.TrimSpace(s)
}

func NormalizeString(s string) string {
	s = removeDiacritics(s)
	s = removeEverythingExceptValidChars(s)

	return s
}

func NormalizeStringNoWhiteSpace(s string) string {
	return strings.ReplaceAll(NormalizeString(s), " ", "")
}

func SplitOnDelimiter(s string, delimiters ...string) []string {
	tokens := []string{s} // adds the full name as the first index to store
	for _, d := range delimiters {
		if strings.Contains(s, d) {
			tokens = append(tokens, strings.Split(s, d)...)
			break
		}
	}

	if len(tokens) == 0 {
		return []string{s}
	}
	return tokens
}

func hasTwoDistinctRepeats(s string) bool {
	s = strings.ToLower(s)
	runes := []rune(s)

	repeated := map[rune]bool{}

	for i := 1; i < len(runes); i++ {
		if runes[i] == runes[i-1] && unicode.IsLetter(runes[i]) {
			repeated[runes[i]] = true
		}
	}

	return len(repeated) >= 2
}

func isBannedInput(input, bannedWord string) bool {
	input = strings.ToLower(input)
	bannedWord = strings.ToLower(bannedWord)

	if len(input) < 1 || len(bannedWord) < 1 || len(input) < len(bannedWord) {
		return false
	}

	multiRepeatedChars := hasTwoDistinctRepeats(input)

	bannedWordLen := len(bannedWord)
	inputLen := len(input)

	correctPosCount := 0

	inputPointer := 0
	bannedPointer := 0
	for i := 0; i < 100 &&
		inputPointer < inputLen &&
		bannedPointer < bannedWordLen &&
		correctPosCount < bannedWordLen; i++ {
		inputChar := input[inputPointer]
		bannedChar := bannedWord[bannedPointer]

		if inputChar == bannedChar {
			correctPosCount++
		} else if inputPointer > 0 && inputPointer+1 < inputLen && !unicode.IsLetter(rune(inputChar)) {
			// a char inbetween is not a letter, obusification
			correctPosCount++
		} else if !multiRepeatedChars && inputPointer > 2 && inputChar == input[i-1] && inputChar == input[i-2] {
			// last three chars repeat, ignore them
			bannedPointer--
		} else if !multiRepeatedChars && inputPointer > 1 && inputPointer+1 < inputLen && inputChar == input[i-1] && inputChar == input[i+1] {
			// last char, current char and next char repeat, ignore them
			bannedPointer--
		} else if multiRepeatedChars && inputPointer > 1 && inputChar == input[i-1] {
			// last 2 chars repeat
			bannedPointer--
		} else if multiRepeatedChars && inputPointer > 1 && inputPointer+1 < inputLen && inputChar == input[i+1] {
			// next 2 chars repeat
			bannedPointer++
		} else {
			correctPosCount = 0
		}

		inputPointer++
		bannedPointer++
	}

	return correctPosCount == bannedWordLen
}
