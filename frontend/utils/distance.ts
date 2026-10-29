import { Coordinates } from "./useLocationStore"

export type DistanceUnit =
  | "kilometers"
  | "meters"
  | "miles"
  | "nauticalMiles"
  | "feet"
  | "yards"

const EARTH_RADIUS: Record<DistanceUnit, number> = {
  kilometers: 6371.0088,
  meters: 6371008.8,
  miles: 3958.7613,
  nauticalMiles: 3440.0695,
  feet: 20902259.8,
  yards: 6967419.9,
}

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

export function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: DistanceUnit = "meters"
): number {
  const radius = EARTH_RADIUS[unit]

  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2

  // Clamp guards against floating-point drift slightly above 1
  const c = 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));

  return radius * c;
}

export function getDistanceBetween(
  from: Coordinates,
  to: Coordinates,
  unit: DistanceUnit = "meters"
): number {
  return getDistance(from.latitude, from.longitude, to.latitude, to.longitude, unit);
}

const distanceFormatter = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export const initDistanceFormatter = (minDp: number | undefined, maxDp: number | undefined) => {
  return new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: minDp,
    maximumFractionDigits: maxDp
  })
}

export const formatDistance = (distance: number, distanceFmt: Intl.NumberFormat = distanceFormatter) => {
  return distanceFmt.format(distance)
}