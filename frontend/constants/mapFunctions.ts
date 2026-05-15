import Mapbox from "@rnmapbox/maps";
import type { Position } from "geojson";
import React from "react";
import { PixelRatio, Platform } from "react-native";

export const SELECTABLE_MAPBOX_LAYER = [
  "poi-label",
  "transit-label",
  "airport-label",
  "continent-label",
  "country-label",
  "state-label",
  "settlement-major-label",
  "settlement-minor-label",
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
  return res;
};

export async function getViewportBounds(mapRef: React.RefObject<Mapbox.MapView|null>) {
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

export const getEmojiForFeature = (props: any): string => {
  const keyword =
    props.type?.toLowerCase() ||
    props.maki?.toLowerCase() ||
    props.category_en?.toLowerCase() ||
    props.class?.toLowerCase() ||
    "";

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
    restaurant: "🍽️",
    cafe: "☕",
    school: "🏫",
    university: "🎓",
    college: "🎓",
    forrest: "🌳",
    park: "🌳",
    airport: "✈️",
    train: "🚆",
    bridge: "🌉",
    bus: "🚌",
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
  };

  for (const key in emojiMap) {
    if (keyword.includes(key)) return emojiMap[key];
  }

  return "📍"; // default emoji
};
