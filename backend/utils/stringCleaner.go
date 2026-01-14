package utils

import (
	"log"
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

func allCharsMatch(s string) bool {
	if len(s) <= 1 {
		return false
	}

	first := s[0]
	for i := 1; i < len(s); i++ {
		if s[i] != first {
			return false
		}
	}
	return true
}

func getBannedSubStr(input, bannedWord string, strictEval bool) (string, string) {
	// if the banned is 4 chars or less and alone
	// if the banned is more than 4 chars
	// contains more than one banned

	input = strings.ToLower(input)
	bannedWord = strings.ToLower(bannedWord)
	minStrictBanLen := 5

	if len(input) < 1 || len(bannedWord) < 1 || len(input) < len(bannedWord) {
		return "", ""
	}

	if input == bannedWord {
		return input, ""
	}

	multiRepeatedChars := hasTwoDistinctRepeats(input)
	inputLen := len(input)

	bannedSubStr := ""
	suspiciousSubStr := ""
	bannedWordEnd := 0

	for j := 0; j < inputLen; j++ {
		inputSubStr := input[j:]
		inputSubStrLen := len(inputSubStr)
		bannedWordLen := len(bannedWord)

		correctPosCount := 0

		inputPointer := 0
		bannedPointer := 0
		for i := 0; i < 100 &&
			inputPointer < inputSubStrLen &&
			bannedPointer < bannedWordLen &&
			correctPosCount < bannedWordLen; i++ {
			inputChar := inputSubStr[inputPointer]
			bannedChar := bannedWord[bannedPointer]

			if inputChar == bannedChar {
				correctPosCount++
				bannedWordEnd++
			} else if string(inputChar) == "." || string(inputChar) == "_" {
				bannedPointer--
			} else if inputPointer > 0 && inputPointer+1 < inputSubStrLen && !unicode.IsLetter(rune(inputChar)) {
				// a char inbetween is not a letter, obusification
				correctPosCount++
				bannedWordEnd++
			} else if !multiRepeatedChars && inputPointer > 2 && inputChar == inputSubStr[i-1] && inputChar == inputSubStr[i-2] {
				// last three chars repeat, ignore them
				bannedPointer--
			} else if !multiRepeatedChars && inputPointer > 1 && inputPointer+1 < inputSubStrLen && inputChar == inputSubStr[i-1] && inputChar == inputSubStr[i+1] {
				// last char, current char and next char repeat, ignore them
				bannedPointer--
			} else if multiRepeatedChars && inputPointer > 1 && inputChar == inputSubStr[i-1] {
				// last 2 chars repeat
				bannedPointer--
			} else if multiRepeatedChars && inputPointer > 1 && inputPointer+1 < inputSubStrLen && inputChar == inputSubStr[i+1] {
				// next 2 chars repeat
				bannedPointer++
			} else {
				correctPosCount = 0
			}

			inputPointer++
			bannedPointer++
		}

		if correctPosCount == bannedWordLen {
			log.Printf("begins with: %v", input[:j])
			log.Printf("ends with: %v", input[bannedWordEnd:])
			if j == 0 && correctPosCount == inputLen {
				// if banned is alone
				bannedSubStr = input
			} else if allCharsMatch(input[:j]) && allCharsMatch(input[bannedWordEnd:]) {
				// if the first and last chars are just repetitions
				bannedSubStr = input
			} else if bannedWordLen >= minStrictBanLen {
				// if banned is long enough
				bannedSubStr = inputSubStr[:inputPointer]
			} else {
				// if input contains banned word but may not actual be a banned term (e.g assistant)
				if strictEval {
					bannedSubStr = inputSubStr[:inputPointer]
				} else {
					suspiciousSubStr = inputSubStr[:inputPointer]
				}
			}
		}
	}

	return bannedSubStr, suspiciousSubStr
}
