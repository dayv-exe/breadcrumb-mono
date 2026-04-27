package helpers

import (
	"backend/constants"
	"backend/utils"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
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
	Type       string      `json:"type"`
	ID         json.Number `json:"id"`
	Geometry   Geometry    `json:"geometry"`
	Properties Properties  `json:"properties"`
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
	ISO31661 string `json:"iso_3166_1"`
	ISO31662 string `json:"iso_3166_2"`

	// Building / roof / garage
	Type        string   `json:"type"`
	Extrude     string   `json:"extrude"`
	Height      *float64 `json:"height"`
	MinHeight   *float64 `json:"min_height"`
	Underground string   `json:"underground"`

	// Address label
	HouseNum string `json:"house_num"`

	// POI
	Name         string `json:"name"`
	NameScript   string `json:"name_script"`
	CategoryEn   string `json:"category_en"`
	CategoryHans string `json:"category_zh-Hans"`
	Class        string `json:"class"`
	Maki         string `json:"maki"`
	SizeRank     *int   `json:"sizerank"`
	FilterRank   *int   `json:"filterrank"`

	// Tilequery metadata (present on every feature in this dataset)
	Tilequery *Tilequery `json:"tilequery"`
}

// Tilequery is the metadata Mapbox's tilequery API attaches to each result.
type Tilequery struct {
	Distance float64 `json:"distance"`
	Geometry string  `json:"geometry"`
	Layer    string  `json:"layer"`
}

func NewMapboxHelper(ctx context.Context) *mapboxHelper {
	out, err := utils.GetDependencies().SecretsManager.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId: &utils.GetDependencies().MapboxSecretArn,
	})
	if err != nil {
		log.Panicf("Failed to get mapbox api key from secret manager. ERROR: %v", err)
	}
	if out.SecretString == nil {
		log.Panicf("secret has no string value")
	}

	var s mapboxSecret
	if err := json.Unmarshal([]byte(*out.SecretString), &s); err != nil {
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

// for gps location use these layers: poi_label, building, structure, transit_stop_label
// if the place ids of the user cur loc matches any of these layers ids then show crumb

// for label locations use these layers in this order for storing: landuse(the poi type, maki or class must match the landuse type or class), building(distance must be 0), structure(distance must be 0), water(distance must be 0). store only the id of the layer that meets conditions, or fall back to storing all ids

// for dropped pin, user should provide radius, if recipient is inside then show crumb

func (h *mapboxHelper) GetNearbyPlaceIds(lat, lon, radius float64, locationSelectionManner string) ([]string, error) {
	if locationSelectionManner == constants.LOCATION_TYPE_DROPPED_PIN {
		log.Printf("location manner not valid for getting nearby place id")
		return make([]string, 0), nil
	}

	locationSelectionManner = strings.ToLower(locationSelectionManner)

	layers := "poi_label,building,structure,water,transit_stop_label"
	if locationSelectionManner == constants.LOCATION_TYPE_LABEL {
		layers += ",landuse"
	}
	endpoint := fmt.Sprintf("%s/%f,%f.json", constants.MAPBOX_TILEQUERY_API, lon, lat)

	q := url.Values{}
	q.Set("radius", fmt.Sprintf("%f", radius))
	q.Set("limit", fmt.Sprintf("%d", constants.MAPBOX_TILEQUERY_LIMIT))
	q.Set("dedupe", "")
	q.Set("layers", layers)
	q.Set("access_token", h.MapboxToken)

	fullURL := endpoint + "?" + q.Encode()

	log.Printf("full url: %s", fullURL)

	req, err := http.NewRequestWithContext(h.Ctx, http.MethodGet, fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("mapbox tilequery request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("mapbox tilequery returned status %d", resp.StatusCode)
	}

	log.Printf("mapbox query ok: %v", resp)

	var fc FeatureCollection
	if err := json.NewDecoder(resp.Body).Decode(&fc); err != nil {
		return nil, fmt.Errorf("decode response: %w", err)
	}

	switch locationSelectionManner {
	case constants.LOCATION_TYPE_MINE, constants.LOCATION_TYPE_FRIEND:
		log.Printf("location selection manner: %s\nGetting gps sel places", locationSelectionManner)
		return getGpsSelectedPlacesId(fc), nil

	case constants.LOCATION_TYPE_LABEL:
		log.Printf("location selection manner: %s\nGetting map clicked sel places", locationSelectionManner)
		return getLabelSelectedPlacesIds(fc), nil

	default:
		return nil, fmt.Errorf("Invalid location manner given!")
	}
}

func getGpsSelectedPlacesId(fc FeatureCollection) []string {
	ids := make([]string, 0)
	for _, feature := range fc.Features {
		ids = append(ids, feature.ID.String())
	}

	log.Printf("gps sel places ids: %v", ids)

	return ids
}

func getLabelSelectedPlacesIds(fc FeatureCollection) []string {
	var clickedLabel Feature
	// first find the label that was clicked
	for _, feature := range fc.Features {
		if feature.Properties.Tilequery.Layer == "poi_label" && feature.Properties.Tilequery.Distance == 0 {
			clickedLabel = feature
			break
		}
	}

	log.Printf("clicked label: %v", clickedLabel)

	// place all the features inside a hash map with their corresponding layer
	items := make(map[string][]Feature, 0)
	for _, feature := range fc.Features {
		layer := strings.ToLower(feature.Properties.Tilequery.Layer)
		items[layer] = append(items[layer], feature)
	}

	log.Printf("mapped features: %v", items)

	ids := make([]string, 0)

	// then find either:
	// landuse where the class type or class == label type or class or maki or category_en
	for _, landuse := range items["landuse"] {
		targetType := strings.ToLower(clickedLabel.Properties.Type)
		targetClass := strings.ToLower(clickedLabel.Properties.Class)
		targetMaki := strings.ToLower(clickedLabel.Properties.Maki)
		targetCategory := strings.ToLower(clickedLabel.Properties.CategoryEn)

		landuseType := strings.ToLower(landuse.Properties.Type)
		landuseClass := strings.ToLower(landuse.Properties.Class)
		landuseMaki := strings.ToLower(landuse.Properties.Maki)
		landuseCategory := strings.ToLower(landuse.Properties.CategoryEn)

		if landuseType == targetType ||
			landuseClass == targetClass ||
			landuseMaki == targetMaki ||
			landuseCategory == targetCategory {
			log.Printf("found match landuse: %v, target: %v", landuse, clickedLabel)
			ids = append(ids, landuse.ID.String())
		}
	}

	if len(ids) > 0 {
		return ids
	}

	// for building, distance from clicked label must be 0
	for _, building := range items["building"] {
		if building.Properties.Tilequery.Distance == 0 {
			log.Printf("found match building: %v, target: %v", building, clickedLabel)
			ids = append(ids, building.ID.String())
		}
	}

	if len(ids) > 0 {
		return ids
	}

	// for structure, distance from clicked label must be 0
	for _, structure := range items["structure"] {
		if structure.Properties.Tilequery.Distance == 0 {
			log.Printf("found match structure: %v, target: %v", structure, clickedLabel)
			ids = append(ids, structure.ID.String())
		}
	}

	if len(ids) > 0 {
		return ids
	}

	log.Printf("found NO matches, returning all ids!")

	// if none of the conditions above are met, return ids of all features
	for _, feature := range fc.Features {
		ids = append(ids, feature.ID.String())
	}
	log.Printf("ids: %v", ids)
	return ids
}
