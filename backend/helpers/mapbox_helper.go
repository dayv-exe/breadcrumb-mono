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
		log.Panicf("Failed to get mapbox api key from secret manager. ERROR:  %#v", err)
	}
	if out.SecretString == nil {
		log.Panicf("secret has no string value")
	}

	var s mapboxSecret
	if err := json.Unmarshal([]byte(*out.SecretString), &s); err != nil {
		log.Panicf("Failed to unmarshal mapbox api key from secrets. ERROR:  %#v", err)
	}

	if strings.TrimSpace(s.ApiKey) == "" {
		log.Panic("Mapbox api key is empty!")
	}

	return &mapboxHelper{
		Ctx:         ctx,
		MapboxToken: s.ApiKey,
	}
}

type placeIdResponse struct {
	placeIds  []string
	placeName string
}

// for gps location use these layers: poi_label, building, structure, transit_stop_label
// if the place ids of the user cur loc matches any of these layers ids then show crumb

// for label locations use these layers in this order for storing: landuse(the poi type, maki or class must match the landuse type or class), building(distance must be 0), structure(distance must be 0), water(distance must be 0). store only the id of the layer that meets conditions, or fall back to storing all ids

// for dropped pin, user should provide radius, if recipient is inside then show crumb

func (h *mapboxHelper) GetNearbyPlaceIds(lat, lon, radius float64, locationSelectionManner, clickedFeatureId string) (placeIdResponse, error) {
	if locationSelectionManner == constants.LOCATION_TYPE_DROPPED_PIN {
		log.Printf("location manner not valid for getting nearby place id")
		return placeIdResponse{
			placeIds:  make([]string, 0),
			placeName: "",
		}, nil
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
		return placeIdResponse{}, fmt.Errorf("build request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return placeIdResponse{}, fmt.Errorf("mapbox tilequery request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return placeIdResponse{}, fmt.Errorf("mapbox tilequery returned status %d", resp.StatusCode)
	}

	log.Printf("mapbox query ok:  %#v", resp)

	var fc FeatureCollection
	if err := json.NewDecoder(resp.Body).Decode(&fc); err != nil {
		return placeIdResponse{}, fmt.Errorf("decode response: %w", err)
	}

	switch locationSelectionManner {
	case constants.LOCATION_TYPE_MINE, constants.LOCATION_TYPE_NONE:
		log.Printf("location selection manner: %s\nGetting gps sel places", locationSelectionManner)
		return getGpsSelectedPlacesId(fc), nil

	case constants.LOCATION_TYPE_LABEL:
		log.Printf("location selection manner: %s\nGetting map clicked sel places", locationSelectionManner)
		if strings.TrimSpace(clickedFeatureId) == "" {
			return placeIdResponse{}, fmt.Errorf("No clicked feature id provided!")
		}
		return getLabelSelectedPlacesIds(fc, clickedFeatureId), nil

	default:
		return placeIdResponse{}, fmt.Errorf("Invalid location manner given!")
	}
}

func getGpsSelectedPlacesId(fc FeatureCollection) placeIdResponse {
	featuresMap := make(map[string][]Feature)
	ids := make([]string, 0)
	for _, feature := range fc.Features {
		featuresMap[feature.Properties.Tilequery.Layer] = append(featuresMap[feature.Properties.Tilequery.Layer], feature)
		ids = append(ids, feature.ID.String())
	}

	var nearestLabel *Feature
	for _, label := range constants.ALLOWED_LABELS {
		for _, labelFeat := range featuresMap[label] {
			if nearestLabel == nil || labelFeat.Properties.Tilequery.Distance < nearestLabel.Properties.Tilequery.Distance {
				nearestLabel = &labelFeat
			}
		}
	}

	log.Printf("gps sel places ids: %#v", ids)

	placename := ""
	if nearestLabel != nil {
		placename = nearestLabel.Properties.Name
		if placename == "" {
			placename = nearestLabel.Properties.HouseNum
		}
	}
	return placeIdResponse{
		placeIds:  ids,
		placeName: placename,
	}
}

func getLabelSelectedPlacesIds(fc FeatureCollection, clickedFeatureId string) placeIdResponse {
	var clickedLabel Feature
	// first find the label that was clicked
	for _, feature := range fc.Features {
		if feature.ID.String() == clickedFeatureId {
			clickedLabel = feature
		}
	}

	log.Printf("clicked label:  %#v", clickedLabel.ID)

	// place all the features inside a hash map with their corresponding layer
	items := make(map[string][]Feature, 0)
	for _, feature := range fc.Features {
		layer := strings.ToLower(feature.Properties.Tilequery.Layer)
		items[layer] = append(items[layer], feature)
	}

	log.Printf("mapped features:  %#v", items)

	ids := []string{
		clickedLabel.ID.String(),
	}

	log.Printf("CLICKED LABEL NAME:  %#v", clickedLabel.Properties.Name)

	log.Printf("ids:  %#v", ids)

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
			log.Printf("found match landuse:  %#v, target:  %#v", landuse.Properties, clickedLabel.Properties)
			ids = append(ids, landuse.ID.String())
		}
	}

	if len(ids) > 1 {
		return placeIdResponse{
			placeIds:  ids,
			placeName: clickedLabel.Properties.Name,
		}
	}

	// for building, distance from clicked label must be 0
	for _, building := range items["building"] {
		if building.Properties.Tilequery.Distance == 0 {
			log.Printf("found match building:  %#v, target:  %#v", building.Properties, clickedLabel.Properties)
			ids = append(ids, building.ID.String())
		}
	}

	if len(ids) > 1 {
		return placeIdResponse{
			placeIds:  ids,
			placeName: clickedLabel.Properties.Name,
		}
	}

	// for structure, distance from clicked label must be 0
	for _, structure := range items["structure"] {
		if structure.Properties.Tilequery.Distance == 0 {
			log.Printf("found match structure:  %#v, target:  %#v", structure.Properties, clickedLabel.Properties)
			ids = append(ids, structure.ID.String())
		}
	}

	if len(ids) > 1 {
		return placeIdResponse{
			placeIds:  ids,
			placeName: clickedLabel.Properties.Name,
		}
	}

	log.Printf("found NO matches, returning all ids!")

	// if none of the conditions above are met, return only clicked poi id

	log.Printf("ids:  %#v", ids)
	return placeIdResponse{
		placeIds:  ids,
		placeName: clickedLabel.Properties.Name,
	}
}

func (h *mapboxHelper) GetFormattedAddress(lat, lon float64) (string, error) {
	endpoint := fmt.Sprintf("%s", constants.MAPBOX_GEOCODING_API)

	q := url.Values{}
	q.Set("longitude", fmt.Sprintf("%f", lon))
	q.Set("latitude", fmt.Sprintf("%f", lat))
	q.Set("access_token", h.MapboxToken)

	fullURL := endpoint + "?" + q.Encode()

	log.Printf("full url: %s", fullURL)

	req, err := http.NewRequestWithContext(h.Ctx, http.MethodGet, fullURL, nil)
	if err != nil {
		return "", fmt.Errorf("build request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("mapbox geocoding request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("mapbox geocoding returned status %d", resp.StatusCode)
	}

	log.Printf("mapbox query ok:  %#v", resp)

	var collection GeocodingResponse
	if err := json.NewDecoder(resp.Body).Decode(&collection); err != nil {
		return "", fmt.Errorf("decode response: %w", err)
	}

	return collection.Features[0].Properties.FullAddress, nil
}

type Location struct {
	Lat float64 `json:"lat"`
	Lon float64 `json:"lon"`
}

type SearchBody struct {
	SessionToken string   `json:"sessionToken"`
	Proximity    Location `json:"proximity"`
	Origin       Location `json:"origin"`
}

type RetrieveBody struct {
	SessionToken string   `json:"sessionToken"`
	Origin       Location `json:"origin"`
}

func (h *mapboxHelper) SearchPlace(query string, body SearchBody) (SuggestResponse, error) {
	endpoint := fmt.Sprintf("%s", constants.MAPBOX_SEARCH_API)
	prox := fmt.Sprintf("%f %f", body.Proximity.Lon, body.Proximity.Lat)
	og := fmt.Sprintf("%f %f", body.Origin.Lon, body.Origin.Lat)

	q := url.Values{}
	q.Set("q", fmt.Sprintf("%s", query))
	q.Set("sessionToken", fmt.Sprintf("%s", body.SessionToken))
	q.Set("proximity", fmt.Sprintf("%s", prox))
	q.Set("origin", fmt.Sprintf("%s", og))
	q.Set("access_token", h.MapboxToken)

	fullURL := endpoint + "?" + q.Encode()

	log.Printf("full url: %s", fullURL)

	req, err := http.NewRequestWithContext(h.Ctx, http.MethodGet, fullURL, nil)
	if err != nil {
		return SuggestResponse{}, fmt.Errorf("build request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return SuggestResponse{}, fmt.Errorf("mapbox search request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return SuggestResponse{}, fmt.Errorf("mapbox search returned status %d", resp.StatusCode)
	}

	log.Printf("mapbox query ok:  %#v", resp)

	var results SuggestResponse
	if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
		return SuggestResponse{}, fmt.Errorf("decode response: %w", err)
	}

	return results, nil
}

func (h *mapboxHelper) RetrievePlace(placeId string, body RetrieveBody) (RetrieveResponse, error) {
	endpoint := fmt.Sprintf("%s/%s", constants.MAPBOX_RETRIEVE_API, placeId)
	og := fmt.Sprintf("%f %f", body.Origin.Lon, body.Origin.Lat)
	q := url.Values{}
	q.Set("sessionToken", fmt.Sprintf("%s", body.SessionToken))
	q.Set("origin", fmt.Sprintf("%s", og))
	q.Set("access_token", h.MapboxToken)

	fullURL := endpoint + "?" + q.Encode()

	log.Printf("full url: %s", fullURL)

	req, err := http.NewRequestWithContext(h.Ctx, http.MethodGet, fullURL, nil)
	if err != nil {
		return RetrieveResponse{}, fmt.Errorf("build request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return RetrieveResponse{}, fmt.Errorf("mapbox retrieve request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return RetrieveResponse{}, fmt.Errorf("mapbox retrieve returned status %d", resp.StatusCode)
	}

	log.Printf("mapbox query ok:  %#v", resp)

	var result RetrieveResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return RetrieveResponse{}, fmt.Errorf("decode response: %w", err)
	}

	return result, nil
}
