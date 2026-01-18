package constants

const (
	MIN_AGE                  = 13
	MAX_AGE                  = 99
	MIN_USERNAME_CHARS       = 3
	MAX_USERNAME_CHARS       = 15
	MAX_FULLNAME_CHARS       = 20
	MAX_STALE_ACCOUNTS_LOOPS = 100 // max number of pages stale account function can loop through before aborting cleanup
	FULL_DATE_LAYOUT         = "02-01-2006"
	MAX_BIO_CHARS            = 50 // max chars allowed in user bio
	MAX_CHUNKABLE_LEN        = 10 // max length a nickname or name can be for creating search index
	MAX_SEARCH_STRING_CHARS  = 20
	PRESIGNED_URL_EXPIRY     = 15
	NAME_CHANGE_DELAY        = 3   // days
	BIRTHDATE_CHANGE_DELAY   = 3   // days
	EMAIL_CHANGE_DELAY       = 21  // days
	MAX_FRIENDS              = 258 // friends
)

var ALLOWED_FILE_TYPES = map[string]struct{}{
	".jpg": {},
	".mp4": {},
}
