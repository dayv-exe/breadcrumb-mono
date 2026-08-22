package models

type MediaItem struct {
	Index             int8         `json:"index"`
	MediaFileName     string       `json:"media"`
	ThumbnailFileName string       `json:"thumbnail"`
	Caption           CrumbCaption `json:"caption"`
	Type              string       `json:"type"`
}

type ValidPresignedMediaItem struct {
	Index         int8               `json:"index"`
	MediaFile     ValidPresignedFile `json:"media,omitempty"`
	ThumbnailFile ValidPresignedFile `json:"thumbnail,omitempty"`
	Caption       CrumbCaption       `json:"caption,omitempty"`
	Type          string             `json:"type"`
}

type PresignRequest struct {
	CrumbNonCompositeId string      `json:"crumbNonCompositeId"`
	Files               []MediaItem `json:"files"`
}

type ValidPresignedFile struct {
	FileName    string            `json:"fileName"`
	ContentType string            `json:"contentType"`
	MediaKey    string            `json:"mediaKey"`
	UploadUrl   string            `json:"uploadUrl"`
	Fields      map[string]string `json:"fields"`
}

type PresignResponse struct {
	ValidFiles []ValidPresignedMediaItem `json:"validFiles"`
}
