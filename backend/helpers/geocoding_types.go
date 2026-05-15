package helpers

// Types for the Mapbox Geocoding API response.
// Kept separate from the tilequery types (FeatureCollection, Feature, etc.)
// in mapbox.go because the two APIs return different shapes:
//   - Tilequery features have numeric IDs and a flat properties union.
//   - Geocoding features have string mapbox IDs and a nested properties object
//     with context, coordinates, match_code, etc.

// GeocodingResponse is the top-level object returned by the Mapbox Geocoding API.
type GeocodingResponse struct {
	// Type is "FeatureCollection", a GeoJSON type from the GeoJSON specification.
	Type string `json:"type"`

	// Features is an array of feature objects.
	// Forward geocodes: ordered by relevance.
	// Reverse geocodes: ordered by index hierarchy, from most specific features
	// to least specific features that overlap the queried coordinates.
	Features []GeocodingFeature `json:"features"`

	// Attribution attributes the results of the Mapbox Geocoding API to Mapbox.
	Attribution string `json:"attribution"`
}

// GeocodingFeature represents a single result feature in the Geocoding response.
type GeocodingFeature struct {
	// ID is the feature id. Named "id" to conform to the GeoJSON specification,
	// but is the same id referred to as mapbox_id elsewhere in the response.
	ID string `json:"id"`

	// Type is "Feature", a GeoJSON type from the GeoJSON specification.
	Type string `json:"type"`

	// Geometry describes the spatial geometry of the returned feature.
	Geometry GeocodingGeometry `json:"geometry"`

	// Properties contains the resulting feature's details.
	Properties GeocodingProperties `json:"properties"`
}

// GeocodingGeometry describes the spatial geometry of a geocoding feature.
type GeocodingGeometry struct {
	// Type is "Point", a GeoJSON type from the GeoJSON specification.
	Type string `json:"type"`

	// Coordinates is an array in the format [longitude, latitude]
	// at the center of the specified bbox.
	Coordinates []float64 `json:"coordinates"`
}

// GeocodingProperties contains the details of a returned geocoding feature.
type GeocodingProperties struct {
	// MapboxID uniquely identifies a place in the Mapbox search database.
	// Mapbox IDs are accepted in requests to the Geocoding API as a forward
	// search, and will return the feature corresponding to that id.
	MapboxID string `json:"mapbox_id"`

	// FeatureType describes the type of the feature. Options are:
	// country, region, postcode, district, place, locality, neighborhood,
	// street, address. (Formerly place_type in v5.)
	FeatureType string `json:"feature_type"`

	// Name is a formatted string of address_number and street.
	Name string `json:"name"`

	// NamePreferred is the canonical or otherwise more common alias for the
	// feature name. For example, searching for "America" will return "America"
	// as the name, and "United States" as name_preferred.
	NamePreferred string `json:"name_preferred,omitempty"`

	// PlaceFormatted is a formatted string of result context:
	// place region country postcode. The part of the result which comes after name.
	PlaceFormatted string `json:"place_formatted,omitempty"`

	// FullAddress is the full formatted string of the feature,
	// combining name_preferred and place_formatted.
	FullAddress string `json:"full_address,omitempty"`

	// Context represents the hierarchy of encompassing parent features.
	Context *GeocodingContext `json:"context,omitempty"`

	// Coordinates represents the geographical position and accuracy
	// of the feature and any routable points.
	Coordinates GeocodingCoordinates `json:"coordinates"`

	// BBox is the bounding box of the feature as an array of
	// [minLon, minLat, maxLon, maxLat]. Only provided with features of type
	// country, region, postcode, district, place, locality, or neighborhood.
	BBox []float64 `json:"bbox,omitempty"`

	// MatchCode is additional metadata indicating how the result components
	// match to the input query.
	MatchCode *GeocodingMatchCode `json:"match_code,omitempty"`
}

// GeocodingContext represents the hierarchy of encompassing parent features.
// Which sub-objects are included depends on the data coverage available
// and applicable to a given country or area.
type GeocodingContext struct {
	Country      *GeocodingContextEntry `json:"country,omitempty"`
	Region       *GeocodingContextEntry `json:"region,omitempty"`
	Postcode     *GeocodingContextEntry `json:"postcode,omitempty"`
	District     *GeocodingContextEntry `json:"district,omitempty"`
	Place        *GeocodingContextEntry `json:"place,omitempty"`
	Locality     *GeocodingContextEntry `json:"locality,omitempty"`
	Neighborhood *GeocodingContextEntry `json:"neighborhood,omitempty"`
	Street       *GeocodingContextEntry `json:"street,omitempty"`
}

// GeocodingContextEntry represents a single level in the context hierarchy.
// Mapbox returns extra fields on some context entries (e.g. country_code,
// region_code, wikidata) so additional optional fields are included.
type GeocodingContextEntry struct {
	MapboxID          string `json:"mapbox_id,omitempty"`
	Name              string `json:"name,omitempty"`
	WikidataID        string `json:"wikidata_id,omitempty"`
	CountryCode       string `json:"country_code,omitempty"`
	CountryCodeAlpha3 string `json:"country_code_alpha_3,omitempty"`
	RegionCode        string `json:"region_code,omitempty"`
	RegionCodeFull    string `json:"region_code_full,omitempty"`
}

// GeocodingCoordinates represents the geographical position and accuracy
// of a geocoding feature.
type GeocodingCoordinates struct {
	// Longitude of the result.
	Longitude float64 `json:"longitude"`

	// Latitude of the result.
	Latitude float64 `json:"latitude"`

	// Accuracy metric for a returned address-type result.
	Accuracy string `json:"accuracy,omitempty"`

	// RoutablePoints is an array of routable point objects for an address feature.
	RoutablePoints []GeocodingRoutablePoint `json:"routable_points,omitempty"`
}

// GeocodingRoutablePoint represents a routable point for an address feature.
type GeocodingRoutablePoint struct {
	Name      string  `json:"name"`
	Longitude float64 `json:"longitude"`
	Latitude  float64 `json:"latitude"`
}

// GeocodingMatchCode provides metadata indicating how the result components
// match to the input query.
type GeocodingMatchCode struct {
	AddressNumber string `json:"address_number,omitempty"`
	Street        string `json:"street,omitempty"`
	Postcode      string `json:"postcode,omitempty"`
	Place         string `json:"place,omitempty"`
	Region        string `json:"region,omitempty"`
	Locality      string `json:"locality,omitempty"`
	Country       string `json:"country,omitempty"`
	Confidence    string `json:"confidence,omitempty"`
}
