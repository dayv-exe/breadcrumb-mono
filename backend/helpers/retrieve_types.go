package helpers

// RetrieveResponse is the top-level response from the Mapbox /retrieve endpoint.
// It is a GeoJSON FeatureCollection.
type RetrieveResponse struct {
	Type        string    `json:"type"` // Always "FeatureCollection"
	Features    []Feature `json:"features"`
	Attribution string    `json:"attribution"`
}

// FeatureProperties contains the specific properties associated with a feature.
type FeatureProperties struct {
	// Required fields
	Name        string      `json:"name"`
	MapboxID    string      `json:"mapbox_id"`
	FeatureType string      `json:"feature_type"`
	Context     Context     `json:"context"`
	Coordinates Coordinates `json:"coordinates"`

	// Optional fields
	NamePreferred  string                 `json:"name_preferred,omitempty"`
	Address        string                 `json:"address,omitempty"`
	FullAddress    string                 `json:"full_address,omitempty"`
	PlaceFormatted string                 `json:"place_formatted,omitempty"`
	BBox           []float64              `json:"bbox,omitempty"` // [minLon, minLat, maxLon, maxLat]
	Language       string                 `json:"language,omitempty"`
	Maki           string                 `json:"maki,omitempty"`
	POICategory    []string               `json:"poi_category,omitempty"`
	POICategoryIDs []string               `json:"poi_category_ids,omitempty"`
	Brand          []string               `json:"brand,omitempty"`
	BrandID        []string               `json:"brand_id,omitempty"`
	ExternalIDs    map[string]string      `json:"external_ids,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
}

// Coordinates contains the geographical coordinates of a result,
// along with optional accuracy and routable points.
type Coordinates struct {
	Longitude      float64         `json:"longitude"`
	Latitude       float64         `json:"latitude"`
	Accuracy       string          `json:"accuracy,omitempty"`
	RoutablePoints []RoutablePoint `json:"routable_points,omitempty"`
}

// RoutablePoint represents a point on the road network associated with a feature.
type RoutablePoint struct {
	Name      string  `json:"name"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Note      string  `json:"note,omitempty"`
}
