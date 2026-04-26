package helpers

import (
	"backend/constants"
	"backend/utils"
	"context"
	"encoding/json"
	"log"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
)

type mapboxHelper struct {
	Ctx         context.Context
	MapboxToken string
}

type mapboxSecret struct {
	ApiKey string `json:"api_key"`
}

// FeatureCollection is the top-level GeoJSON object.
type FeatureCollection struct {
	Type     string    `json:"type"`
	Features []Feature `json:"features"`
}

// Feature represents a single GeoJSON feature.
// ID is json.Number to preserve large integer IDs (e.g. 31340153450)
// without precision loss from float64 conversion.
type Feature struct {
	Type       string     `json:"type"`
	ID         string     `json:"id"`
	Geometry   Geometry   `json:"geometry"`
	Properties Properties `json:"properties"`
}

// Geometry is a GeoJSON Point geometry.
// Coordinates are [longitude, latitude].
type Geometry struct {
	Type        string    `json:"type"`
	Coordinates []float64 `json:"coordinates"`
}

// Properties holds the union of all property fields seen across feature types.
// Fields use omitempty so each feature only serializes the properties it has.
//
// Note: "extrude" and "underground" come through as JSON strings ("true"/"false"),
// not booleans, so they're modeled as string.
type Properties struct {
	// Common
	ISO31661 string `json:"iso_3166_1,omitempty"`
	ISO31662 string `json:"iso_3166_2,omitempty"`

	// Building / roof / garage
	Type        string   `json:"type,omitempty"`
	Extrude     string   `json:"extrude,omitempty"`
	Height      *float64 `json:"height,omitempty"`
	MinHeight   *float64 `json:"min_height,omitempty"`
	Underground string   `json:"underground,omitempty"`

	// Address label
	HouseNum string `json:"house_num,omitempty"`

	// POI
	Name         string `json:"name,omitempty"`
	NameScript   string `json:"name_script,omitempty"`
	CategoryEn   string `json:"category_en,omitempty"`
	CategoryHans string `json:"category_zh-Hans,omitempty"`
	Class        string `json:"class,omitempty"`
	Maki         string `json:"maki,omitempty"`
	SizeRank     *int   `json:"sizerank,omitempty"`
	FilterRank   *int   `json:"filterrank,omitempty"`

	// Tilequery metadata (present on every feature in this dataset)
	Tilequery *Tilequery `json:"tilequery,omitempty"`
}

// Tilequery is the metadata Mapbox's tilequery API attaches to each result.
type Tilequery struct {
	Distance float64 `json:"distance"`
	Geometry string  `json:"geometry"`
	Layer    string  `json:"layer"`
}

func NewMapboxHelper(ctx context.Context) *mapboxHelper {
	out, err := utils.GetDependencies().SecretsManager.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: &utils.GetDependencies().SecretArn,
	})
	if err != nil {
		log.Panicf("Failed to get mapbox api key from secret manager. ERROR: %v", err)
	}
	if out.SecretString == nil {
		log.Panicf("secret has no string value")
	}

	var s mapboxSecret
	if err := json.Unmarshal(out.SecretBinary, &s); err != nil {
		log.Panicf("Failed to unmarshal mapbox api key from secrets. ERROR: %v", err)
	}

	if strings.TrimSpace(s.ApiKey) == "" {
		log.Panic("Mapbox api key is empty!")
	}

	return &mapboxHelper{
		Ctx:         ctx,
		MapboxToken: s.ApiKey,
	}
}

func GetNearbyPlaceIds(lat, lon, radius float64, locationSelectionManner string) ([]string, error) {
	// for gps location use these layers: poi_label, building, structure, transit_stop_label
	// if the place ids of the user cur loc matches any of these layers ids then show crumb

	// for label locations use these layers in this order for storing: landuse(the poi type, maki or class must match the landuse type or class), building(distance must be 0), structure(distance must be 0), water(distance must be 0). store only the id of the layer that meets conditions, or fall back to storing all ids

	// for dropped pin, user should provide radius, if recipient is inside then show crumb

	if strings.ToLower(locationSelectionManner) == constants.LOCATION_TYPE_MINE {
		// gps location

	}

	return nil, nil
}
