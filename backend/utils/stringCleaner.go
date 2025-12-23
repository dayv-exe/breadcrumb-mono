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

func bannedWordMatch(input, bannedWord string) float64 {
	if len(input) < 1 || len(bannedWord) < 1 {
		return 0
	}

	var matchPct = 0.0

	correctPosCount := 0.0
	n := float64(len(bannedWord))

	for i := 0; i < len(input); i++ {
		if i >= len(bannedWord) {
			break
		}
		if bannedWord[i] == input[i] {
			// if chars match or char is not an alphabet e.g f*ck, f$ck, f ck will all return 100%
			correctPosCount++
		} else if i > 0 && !unicode.IsLetter(rune(input[i])) {
			if (i-1 >= 0 && unicode.IsLetter(rune(input[i-1]))) ||
				(i+1 < len(input) && unicode.IsLetter(rune(input[i+1]))) {
				// if the last char is not a letter, and the next char is also not a letter then ignore
				// e.g f123 will not matched with the f word
				correctPosCount++
			}
		}
	}

	matchPct = max(matchPct, (float64(correctPosCount/n) * 100))

	return matchPct
}
