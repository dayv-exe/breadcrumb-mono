export type location = {
  lat: number
  lon: number
}

export type searchBody = {
  sessionToken: string
  query: string
  proximity: location
  origin: location
}

export type retrieveBody = {
  sessionToken: string
  placeId: string
  origin: location
}

// TypeScript types for the Mapbox /suggest endpoint response.

/** Top-level response from the Mapbox /suggest endpoint. */
export interface SuggestResponse {
  suggestions: Suggestion[];
  attribution: string;
}

/** A single autocomplete suggestion result. */
export interface Suggestion {
  // Required fields
  name: string;
  mapbox_id: string;
  feature_type: string;
  place_formatted: string;
  context: Context;
  language: string;

  // Optional fields
  name_preferred?: string;
  address?: string;
  full_address?: string;
  maki?: string;
  poi_category?: string[];
  poi_category_ids?: string[];
  brand?: string[];
  brand_id?: string[];
  external_ids?: Record<string, string>;
  metadata?: Record<string, unknown>;
  distance?: number;
  eta?: number;
  added_distance?: number;
  added_time?: number;
}

/**
 * The administrative hierarchy for a suggestion.
 * All layers are optional and follow the Administrative unit types hierarchy.
 */
export interface Context {
  country?: CountryContext;
  region?: RegionContext;
  postcode?: PostcodeContext;
  district?: DistrictContext;
  place?: PlaceContext;
  locality?: LocalityContext;
  neighborhood?: NeighborhoodContext;
  address?: AddressContext;
  street?: StreetContext;
}

/** The country layer of a result's context. */
export interface CountryContext {
  id: string;
  name: string;
  /** ISO 3166-1 alpha-2 */
  country_code: string;
  /** ISO 3166-1 alpha-3 */
  country_code_alpha_3: string;
}

/** The region layer of a result's context. */
export interface RegionContext {
  id: string;
  name: string;
  region_code: string;
  /** ISO 3166-2 */
  region_code_full: string;
}

/** The postcode layer of a result's context. */
export interface PostcodeContext {
  id: string;
  name: string;
}

/** The district layer of a result's context. */
export interface DistrictContext {
  id: string;
  name: string;
}

/** The place layer of a result's context. */
export interface PlaceContext {
  id: string;
  name: string;
}

/** The locality layer of a result's context. */
export interface LocalityContext {
  id: string;
  name: string;
}

/** The neighborhood layer of a result's context. */
export interface NeighborhoodContext {
  id: string;
  name: string;
}

/** The address layer of a result's context, including address number and street. */
export interface AddressContext {
  id: string;
  name: string;
  address_number: string;
  street_name: string;
}

/** The street layer of a result's context. */
export interface StreetContext {
  id: string;
  name: string;
}

/**
 * Top-level response from the Mapbox /retrieve endpoint.
 * It is a GeoJSON FeatureCollection.
 */
export interface RetrieveResponse {
  /** Always "FeatureCollection" */
  type: "FeatureCollection";
  features: RetrieveFeature[];
  attribution: string;
}

/** A single GeoJSON feature in the retrieve response. */
export interface RetrieveFeature {
  /** Always "Feature" */
  type: "Feature";
  geometry: RetrieveGeometry;
  properties: FeatureProperties;
}

/** The spatial geometry of a returned feature. */
export interface RetrieveGeometry {
  /** Always "Point" */
  type: "Point";
  /** [longitude, latitude] */
  coordinates: [number, number];
}

/** The specific properties associated with a feature. */
export interface FeatureProperties {
  // Required fields
  name: string;
  mapbox_id: string;
  feature_type: string;
  context: Context;
  coordinates: Coordinates;

  // Optional fields
  name_preferred?: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  /** [minLon, minLat, maxLon, maxLat] */
  bbox?: [number, number, number, number];
  language?: string;
  maki?: string;
  poi_category?: string[];
  poi_category_ids?: string[];
  brand?: string[];
  brand_id?: string[];
  external_ids?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

/** Accuracy values for address-type results. */
export type CoordinateAccuracy =
  | "rooftop"
  | "parcel"
  | "point"
  | "interpolated"
  | "intersection"
  | "approximate"
  | "street";

/**
 * Geographical coordinates of a result, with optional accuracy
 * and routable points.
 */
export interface Coordinates {
  longitude: number;
  latitude: number;
  accuracy?: CoordinateAccuracy;
  routable_points?: RoutablePoint[];
}

/** A point on the road network associated with a feature. */
export interface RoutablePoint {
  name: string;
  latitude: number;
  longitude: number;
  note?: string;
}