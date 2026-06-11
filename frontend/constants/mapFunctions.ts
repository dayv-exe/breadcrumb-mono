import Mapbox from "@rnmapbox/maps";
import type { Feature, GeoJsonProperties, Geometry, Position } from "geojson";
import React from "react";
import { PixelRatio, Platform } from "react-native";

export const SELECTABLE_MAPBOX_LAYER = [
  "poi-label",
  "building-number-label",
  "transit-label",
  "airport-label",
  // "continent-label",
  // "country-label",
  // "state-label",
  // "settlement-major-label",
  // "settlement-minor-label",
  // "settlement-subdivision-label",
]

export const getPressedLocationInfo = async (
  e: any,
  mapRef: React.RefObject<Mapbox.MapView | null>
) => {
  let x = e.properties.screenPointX;
  let y = e.properties.screenPointY;

  // On Android, screenPointX/Y come back in raw device pixels,
  // but queryRenderedFeaturesAtPoint expects density-independent pixels.
  if (Platform.OS === "android") {
    const ratio = PixelRatio.get();
    x = x / ratio;
    y = y / ratio;
  }

  const screenPoint: Position = [x, y];

  const res = await mapRef.current?.queryRenderedFeaturesAtPoint(
    screenPoint,
    undefined,
    SELECTABLE_MAPBOX_LAYER
  );
  if (res?.features[0] && (res.features[0].properties as any).mode === "rail") return undefined
  return res;
};

export async function getViewportBounds(mapRef: React.RefObject<Mapbox.MapView | null>) {
  if (!mapRef?.current) return null;

  // Returns [[neLon, neLat], [swLon, swLat]]
  const bounds = await mapRef.current.getVisibleBounds();
  const [[maxLon, maxLat], [minLon, minLat]] = bounds;

  return { minLat, maxLat, minLon, maxLon };
}

type FeatureProps = {
  category_en?: string;
  class?: string;
  maki?: string;
  type?: string;
  [key: string]: unknown;
};

export const getPlaceType = (props: GeoJsonProperties): string => {
  const type = props?.type || props?.maki || props?.category_en || props?.class || "";

  if (!type && props?.house_num) {
    return "Residence"
  }

  if (!type) return "Location"

  return type.charAt(0).toUpperCase() + type.slice(1);
}

export const getEmojiForFeature = (props: Feature<Geometry, GeoJsonProperties>): string => {
  const keyword =
    props.properties?.type?.toLowerCase() ||
    props.properties?.maki?.toLowerCase() ||
    props.properties?.category_en?.toLowerCase() ||
    props.properties?.class?.toLowerCase() ||
    "";

  if (!keyword && props.properties?.house_num) {
    return "🏠"
  }

  const emojiMap: Record<string, string> = {
    common: "🌳",
    "nature reserve": "🌳",
    "charging station": "🔋",
    fuel: "⛽️",
    veterinary: "🐾",
    doctor: "🩺",
    doctors: "🩺",
    prison: "🔒",
    courthouse: "👩‍⚖️",
    mall: "🏬",
    aquarium: "🐠",
    "archaeological site": "📚",
    "community centre": "🏘️",
    dentist: "🦷",
    ruins: "🏚️",
    pharmacy: "💊",
    "grave yard": "🪦",
    "guest house": "🏠",
    "wreck": "🏚️",
    industrial: "🏭",
    wood: "🪾",
    alcohol: "🥴",
    garden: "🪴",
    monument: "🗿",
    memorial: "🕯️",
    "cruise terminal": "🛳️",
    harbour: "⚓️",
    parking: "🅿️",
    hospital: "🏥",
    medical: "💉",
    restaurant: "🍝",
    cafe: "☕️",
    school: "🏫",
    university: "🎓",
    college: "🎓",
    forrest: "🌳",
    forest: "🌳",
    park: "🌳",
    airport: "🛩️",
    train: "🚆",
    bridge: "🌉",
    bus: "🚏",
    castle: "🏰",
    pier: "⚓️",
    bank: "🏦",
    post: "📮",
    police: "👮‍♂️",
    hotel: "🏨",
    church: "⛪",
    supermarket: "🛒",
    shop: "🏪",
    railway: "🚃",
    retail: "🏪",
    shopping: "🛍️",
    museum: "🏛️",
    stadium: "🏟️",
    grocery: "🛒",
    lodging: "🏨",
    attraction: "📸",
    gallery: "🖼️",
    "art": "🖼️",
    cemetery: "🪦",
    golf: "⛳️",
    theatre: "🎭",
    library: "📚",
    bar: "🍷",
    pub: "🍻",
    construction: "🏗️",
    "fast food": "🍔",
    "clothes": "👕",
    "shoes": "👟",
    "cosmetics": "💄",
    "jewelry": "💍",
    "commercial": "📉",
    "mobile phone": "☎️",
    "beauty": "💄",
    "beach": "🏖️",
    bakery: "🥐",
    cinema: "🎬",
    lawyer: "⚖️",
    casino: "🎰",
    convenience: "🏪",
    anime: "😽",
    hairdresser: "💇",
    "fort": "🏰",
    zoo: "🦁",
    "airfield": "🛩️",
    "furniture": "🛋️",
    playground: "🛝",
    residential: "🏡",
    fitness: "🏋️‍♀️",
    "fitness centre": "💪",
    farm: "🚜",
    music: "🎧",
    electronics: "🔌",
    gift: "🎁",
    seafood: "🍤",
    toys: "🧸",
    allotments: "🌱"
  };

  for (const key in emojiMap) {
    if (keyword.includes(key)) return emojiMap[key];
  }

  return "📍"; // default emoji
};

export type MapCamPosition = {
  coords: [number, number]
  zoom: number
}
export async function getMapCamPosition(mapRef: React.RefObject<Mapbox.MapView | null>): Promise<MapCamPosition | null> {
  if (!mapRef.current) return null
  const zoom = await mapRef.current.getZoom()
  const center = await mapRef.current.getCenter()

  return { coords: [center[0], center[1]], zoom: zoom }
}

const EARTH_RADIUS_METERS = 6_371_000;

/**
 * Returns the great-circle distance in meters between two points specified
 * by latitude/longitude in decimal degrees, using the Haversine formula.
 */
export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}