package utils

import "backend/constants"

func BioIsValid(bio *string) bool {
	return len(*bio) <= constants.MAX_BIO_CHARS
}
