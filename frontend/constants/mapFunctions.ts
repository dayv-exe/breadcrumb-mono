import Mapbox from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";

const getCountryBounds = async (countryName: string, token: string) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(countryName)}.json?types=country&access_token=${token}`
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      return data.features[0].bbox;
    }
  } catch (error) {
    console.error('Error fetching country bounds:', error);
  }
  return null;
};

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
  res?.features.forEach(async (feature) => {
    if (feature.properties?.iso_3166_1) {
      // console.log("country: ", feature.properties.name)
      // console.log("country code: ", feature.properties.iso_3166_1)
      // const bounds = await getCountryBounds(feature.properties.name, token);
      // console.log(bounds)
    }
    console.log(feature)
  });

};