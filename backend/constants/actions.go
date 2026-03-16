package constants

const (
	// actions for friendship function
	FRIENDSHIP_ACTION_REQUEST                 = "request"
	FRIENDSHIP_ACTION_CANCEL_REQUEST          = "cancel-request"
	FRIENDSHIP_ACTION_REJECT                  = "reject"
	FRIENDSHIP_ACTION_ACCEPT                  = "accept"
	FRIENDSHIP_ACTION_END_FRIENDSHIP          = "end"
	FRIENDSHIP_ACTION_GET_FRIENDS             = "all"
	FRIENDSHIP_ACTION_GET_REQUESTED           = "pending"
	QUEUE_ACTION_UPDATE_FRIENDS_DISPLAY_INFO  = "update_friends_display_info"
	QUEUE_ACTION_UPDATE_REQUESTS_DISPLAY_INFO = "update_requests_display_info"
)

type LOCATION_TYPE string

const (
	MY_LOCATION      LOCATION_TYPE = "mine"
	FRIENDS_LOCATION LOCATION_TYPE = "friends"
	SELECT_ON_MAP    LOCATION_TYPE = "map"
)

type CRUMB_STATUS string
