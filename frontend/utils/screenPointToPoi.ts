import Mapbox from "@rnmapbox/maps";
import { Position } from "@rnmapbox/maps/lib/typescript/src/types/Position";

interface POIFeature {
  id: string;
  type: string;
  geometry: {
    type: string;
    coordinates: Position;
  };
  properties: {
    name?: string;
    class?: string;
    type?: string;
    [key: string]: any;
  };
}

interface POIQueryResult {
  features: POIFeature[];
  screenCoordinates: { x: number; y: number };
  geoCoordinates: Position | null;
}

/**
 * Query POIs at a screen coordinate using Mapbox
 * @param mapRef - Reference to the Mapbox MapView
 * @param screenX - Screen X coordinate (from touch event)
 * @param screenY - Screen Y coordinate (from touch event)
 * @param layerIds - Optional array of layer IDs to query (defaults to POI layers)
 * @returns Promise with POI features found at that location
 */
export async function queryPOIAtScreenCoordinate(
  mapRef: React.RefObject<Mapbox.MapView | null>,
  screenX: number,
  screenY: number,
  layerIds?: string[]
): Promise<POIQueryResult> {
  if (!mapRef.current) {
    throw new Error("Map reference is not available");
  }

  try {
    // Convert screen coordinates to geographic coordinates
    const geoCoordinates = await mapRef.current.getCoordinateFromView([screenX, screenY]);
    
    // Query rendered features at the screen point
    // Default POI layers in Mapbox styles typically include:
    // - poi-label
    // - poi-label-major
    // - transit-label
    // - place-label
    const defaultLayerIds = [
      'poi-label',
      'poi-label-major', 
      'transit-label',
      'place-label',
      'place-city-label',
      'place-town-label',
      'place-village-label',
    ];

    const features = await mapRef.current.queryRenderedFeaturesAtPoint(
      [screenX, screenY],
      undefined, // filter expression (optional)
      layerIds || defaultLayerIds
    );

    // Parse and return the features
    const poiFeatures: POIFeature[] = features!.features.map((feature: any) => ({
      id: feature.id || `${feature.properties?.name || 'unknown'}-${Date.now()}`,
      type: feature.type,
      geometry: feature.geometry,
      properties: feature.properties || {},
    }));

    return {
      features: poiFeatures,
      screenCoordinates: { x: screenX, y: screenY },
      geoCoordinates,
    };
  } catch (error) {
    console.error("Error querying POI at screen coordinate:", error);
    throw error;
  }
}

/**
 * Query POIs in a bounding box around a screen coordinate
 * @param mapRef - Reference to the Mapbox MapView
 * @param screenX - Screen X coordinate
 * @param screenY - Screen Y coordinate
 * @param boxSize - Size of the bounding box in pixels (default: 20)
 * @param layerIds - Optional array of layer IDs to query
 * @returns Promise with POI features found in the area
 */
export async function queryPOIInAreaAroundPoint(
  mapRef: React.RefObject<Mapbox.MapView | null>,
  screenX: number,
  screenY: number,
  boxSize: number = 20,
  layerIds?: string[]
): Promise<POIQueryResult> {
  if (!mapRef.current) {
    throw new Error("Map reference is not available");
  }

  try {
    const geoCoordinates = await mapRef.current.getCoordinateFromView([screenX, screenY]);
    
    const halfBox = boxSize / 2;
    const bbox: [number, number, number, number] = [
      screenX - halfBox,
      screenY - halfBox,
      screenX + halfBox,
      screenY + halfBox,
    ];

    const defaultLayerIds = [
      'poi-label',
      'poi-label-major',
      'transit-label',
      'place-label',
      'place-city-label',
      'place-town-label',
      'place-village-label',
    ];

    const features = await mapRef.current.queryRenderedFeaturesInRect(
      bbox,
      undefined,
      layerIds || defaultLayerIds
    );

    const poiFeatures: POIFeature[] = features!.features.map((feature: any) => ({
      id: feature.id || `${feature.properties?.name || 'unknown'}-${Date.now()}`,
      type: feature.type,
      geometry: feature.geometry,
      properties: feature.properties || {},
    }));

    return {
      features: poiFeatures,
      screenCoordinates: { x: screenX, y: screenY },
      geoCoordinates,
    };
  } catch (error) {
    console.error("Error querying POI in area:", error);
    throw error;
  }
}

/**
 * Get the most relevant POI from query results
 * Prioritizes named POIs and major points of interest
 */
export function getMostRelevantPOI(features: POIFeature[]): POIFeature | null {
  if (features.length === 0) return null;

  // Sort by relevance: named features first, then by layer priority
  const sorted = features.sort((a, b) => {
    // Prioritize features with names
    const aHasName = !!a.properties.name;
    const bHasName = !!b.properties.name;
    if (aHasName && !bHasName) return -1;
    if (!aHasName && bHasName) return 1;

    // Prioritize major POIs
    const aIsMajor = a.properties.class === 'major' || a.properties.type?.includes('major');
    const bIsMajor = b.properties.class === 'major' || b.properties.type?.includes('major');
    if (aIsMajor && !bIsMajor) return -1;
    if (!aIsMajor && bIsMajor) return 1;

    return 0;
  });

  return sorted[0];
}