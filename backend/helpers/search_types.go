package helpers

// SuggestResponse is the top-level response from the Mapbox /suggest endpoint.
type SuggestResponse struct {
	Suggestions []Suggestion `json:"suggestions"`
	Attribution string       `json:"attribution"`
}

// Suggestion represents a single autocomplete suggestion result.
type Suggestion struct {
	// Required fields
	Name           string  `json:"name"`
	MapboxID       string  `json:"mapbox_id"`
	FeatureType    string  `json:"feature_type"`
	PlaceFormatted string  `json:"place_formatted"`
	Context        Context `json:"context"`
	Language       string  `json:"language"`

	// Optional fields
	NamePreferred  string                 `json:"name_preferred,omitempty"`
	Address        string                 `json:"address,omitempty"`
	FullAddress    string                 `json:"full_address,omitempty"`
	Maki           string                 `json:"maki,omitempty"`
	POICategory    []string               `json:"poi_category,omitempty"`
	POICategoryIDs []string               `json:"poi_category_ids,omitempty"`
	Brand          []string               `json:"brand,omitempty"`
	BrandID        []string               `json:"brand_id,omitempty"`
	ExternalIDs    map[string]string      `json:"external_ids,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	Distance       *float64               `json:"distance,omitempty"`
	ETA            *float64               `json:"eta,omitempty"`
	AddedDistance  *float64               `json:"added_distance,omitempty"`
	AddedTime      *float64               `json:"added_time,omitempty"`
}

// Context contains the administrative hierarchy for a suggestion.
// All layers are optional and follow the Administrative unit types hierarchy.
type Context struct {
	Country      *CountryContext      `json:"country,omitempty"`
	Region       *RegionContext       `json:"region,omitempty"`
	Postcode     *PostcodeContext     `json:"postcode,omitempty"`
	District     *DistrictContext     `json:"district,omitempty"`
	Place        *PlaceContext        `json:"place,omitempty"`
	Locality     *LocalityContext     `json:"locality,omitempty"`
	Neighborhood *NeighborhoodContext `json:"neighborhood,omitempty"`
	Address      *AddressContext      `json:"address,omitempty"`
	Street       *StreetContext       `json:"street,omitempty"`
}

// CountryContext represents the country layer of a result's context.
type CountryContext struct {
	ID                string `json:"id"`
	Name              string `json:"name"`
	CountryCode       string `json:"country_code"`
	CountryCodeAlpha3 string `json:"country_code_alpha_3"`
}

// RegionContext represents the region layer of a result's context.
type RegionContext struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	RegionCode     string `json:"region_code"`
	RegionCodeFull string `json:"region_code_full"`
}

// PostcodeContext represents the postcode layer of a result's context.
type PostcodeContext struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// DistrictContext represents the district layer of a result's context.
type DistrictContext struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// PlaceContext represents the place layer of a result's context.
type PlaceContext struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// LocalityContext represents the locality layer of a result's context.
type LocalityContext struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// NeighborhoodContext represents the neighborhood layer of a result's context.
type NeighborhoodContext struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// AddressContext represents the address layer of a result's context,
// including the address number and street.
type AddressContext struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	AddressNumber string `json:"address_number"`
	StreetName    string `json:"street_name"`
}

// StreetContext represents the street layer of a result's context.
type StreetContext struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}
