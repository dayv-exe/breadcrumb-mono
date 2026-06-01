import { getLatestCrumbs } from "@/api/crumbsApi";
import { GetAllCrumbs, GetLastReceivedCrumbDetails } from "@/api/db/crumbsDb";
import Mapbox from "@rnmapbox/maps";
import { useFocusEffect } from "expo-router";
import type { Feature, FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { useCallback, useMemo, useState } from "react";
import { useGetCrumbMarkers } from "./queries/useCrumbsApi";

type UseCrumbType = {
  crumbImages: { [key: string]: Mapbox.ImageEntry }
  crumbFeatures: FeatureCollection
  fetchCrumbs: () => Promise<void>
}

export const useCrumb = (): UseCrumbType => {
  const { data: crumbMarkers, isError: crumbMarkersIsError, isPending: crumbMarkersPending, error: crumbMarkersError } = useGetCrumbMarkers()

  const crumbImages = useMemo<{ [key: string]: Mapbox.ImageEntry }>(
    () =>
      (crumbMarkers ?? []).reduce<{ [key: string]: Mapbox.ImageEntry }>(
        (acc, marker) => {
          acc[marker.userid] = { uri: marker.profilePictureThumbnail }
          return acc
        },
        {}
      ),
    [crumbMarkers]
  )

  const [crumbFeatures, setCrumbFeatures] = useState<FeatureCollection>({
    type: 'FeatureCollection',
    features: [
    ],
  })

  const newCrumbFeature = (crumbId: string, crumbSender: string, lat: number, lon: number, senderNickname: string, prompt: string, placename: string): Feature<Point, GeoJsonProperties> => {
    return {
      type: 'Feature',
      id: crumbId,
      properties: {
        profilePicture: crumbSender,
        nickname: senderNickname,
        prompt: prompt,
        placename: placename,
      },
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      }
    }
  }

  const updateCrumbs = async () => {
    const lastCrumb = await GetLastReceivedCrumbDetails();
    const latestCrumb = await getLatestCrumbs(
      false,
      lastCrumb?.id,
      lastCrumb?.time
    );

    try {
      if (latestCrumb.crumbs) {
        const newFeatures: Feature<Point>[] = latestCrumb.crumbs.map(crumb => (newCrumbFeature(
          crumb.id,
          crumb.sender,
          crumb.lat,
          crumb.lon,
          "x",
          "",
          crumb.placename,
        )));

        setCrumbFeatures(prev => ({
          ...prev,
          features: [...prev.features, ...newFeatures]
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCrumbs = async () => {
    const crumbs = await GetAllCrumbs()
    const features: Feature<Point>[] = crumbs.map(crumb => (newCrumbFeature(
      crumb.id,
      crumb.sender,
      crumb.lat,
      crumb.lon,
      "x",
      "",
      crumb.placename,
    )));

    setCrumbFeatures({
      type: 'FeatureCollection',
      features
    });
  }

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        updateCrumbs();
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }, [])
  );

  return {
    crumbImages,
    crumbFeatures,
    fetchCrumbs,
  }
}