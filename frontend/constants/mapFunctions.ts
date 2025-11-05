import Mapbox from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";

export const getPressedLocationInfo = async (e: any, mapRef: React.RefObject<Mapbox.MapView | null>, token: string) => {
  const screenPoint: Position = [e.properties.screenPointX, e.properties.screenPointY];
  const res = await mapRef.current?.queryRenderedFeaturesAtPoint(screenPoint, null, [
    "poi-label",
    "continent-label",
    "country-label",
    "admin-0-boundary",
    "state-label",
    "settlement-major-label",
    "settlement-minor-label",
    "settlement-subdivision-label",
  ]);
  console.log(res?.features[0])
  return res?.features[0]
};

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
