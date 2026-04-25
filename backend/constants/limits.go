package constants

const (
	MIN_AGE                  = 13
	MAX_AGE                  = 120
	MIN_USERNAME_CHARS       = 3
	MAX_USERNAME_CHARS       = 15
	MAX_FULLNAME_CHARS       = 20
	MAX_STALE_ACCOUNTS_LOOPS = 100 // max number of pages stale account function can loop through before aborting cleanup
	FULL_DATE_LAYOUT         = "02-01-2006"
	FULL_DATE_TIME_LAYOUT    = "02-01-2006 15:04:05"
	MAX_BIO_CHARS            = 50 // max chars allowed in user bio
	MAX_CHUNKABLE_LEN        = 10 // max length a nickname or name can be for creating search index
	MAX_SEARCH_STRING_CHARS  = 20
	PRESIGNED_URL_EXPIRY     = 15
	CRUMB_MEDIA_URL_TTL      = 5                //mins
	PROFILE_PICTURE_URL_TTL  = 15               //mins
	NAME_CHANGE_DELAY        = 3                // days
	BIRTHDATE_CHANGE_DELAY   = 3                // days
	EMAIL_CHANGE_DELAY       = 21               // days
	MAX_FRIENDS              = 258              // friends
	MAX_UPLOAD_AMOUNT        = 5                // items
	MAX_UPLOAD_SIZE          = 50 * 1024 * 1024 // 50 MB
	MAP_ZOOM_SMALL           = 10               // for geo hashing
	MAP_ZOOM_MID             = 7                // for geo hashing
	MAP_ZOOM_BIG             = 2                // for geo hashing
	MAP_ZOOM_VBIG            = 0                // for geo hashing
	LOCATION_TYPE_MINE       = "mine"
	LOCATION_TYPE_FRIEND     = "friend"
	LOCATION_TYPE_GPS        = "map"
	EARTH_RADIUS             = 6_371_000 // meters
)

var ALLOWED_FILE_TYPES = map[string]struct{}{
	".jpg": {},
	".mp4": {},
}
