package constants

const (
	// actions for friendship function
	FRIEND_ACTION_REQUEST                     = "request"
	FRIEND_ACTION_CANCEL_REQUEST              = "cancel-request"
	FRIEND_ACTION_REJECT                      = "reject"
	FRIEND_ACTION_ACCEPT                      = "accept"
	FRIEND_ACTION_END_FRIEND                  = "end"
	FRIEND_ACTION_GET_FRIENDS                 = "all"
	FRIEND_ACTION_GET_REQUESTED               = "pending"
	QUEUE_ACTION_UPDATE_FRIENDS_DISPLAY_INFO  = "update_friends_display_info"
	QUEUE_ACTION_UPDATE_REQUESTS_DISPLAY_INFO = "update_requests_display_info"
	QUEUE_ACTION_PROCESS_VIDEO                = "process_video"
)

type CRUMB_STATUS string
