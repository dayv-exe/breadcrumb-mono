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