package models

type Friendship struct {
	FriendId string `json:"friendId" dynamodbav:"friendId"`

	PictureUrl  string `json:"pictureUrl" dynamodbav:"pictureUrl"`
	Name        string `json:"name" dynamodbav:"name"`
	Nickname    string `json:"nickname" dynamodbav:"nickname"`
	DisplayName string `json:"displayName" dynamodbav:"displayName"`

	CreatedAt int64 `json:"createdAt" dynamodbav:"createdAt"`
	Timestamp int64 `json:"timestamp" dynamodbav:"timestamp"`

	Status string `json:"status" dynamobdav:"status"`

	Pk string `json:"-" dynamodbav:"pk"`
	Sk string `json:"-" dynamodbav:"sk"`

	Gsi   string `json:"-" dynamodbav:"gsi"`
	GsiSk string `json:"-" dynamodbav:"gsiSk"`
}
