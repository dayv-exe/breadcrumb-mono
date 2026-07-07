import { getLatestCrumbs } from "@/api/crumbsApi";
import { GetAllCrumbs, GetCrumbsByIds, GetLastCrumbDetails } from "@/api/db/crumbsDb";
import { Crumb, CrumbMailbox } from "@/api/models/crumb";
import { useAuthStore } from "@/utils/authStore";
import Mapbox from "@rnmapbox/maps";
import { useFocusEffect } from "expo-router";
import type { Feature, FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useGetCrumbMarkers } from "./queries/useCrumbsApi";

type UseCrumbType = {
  crumbImages: { [key: string]: Mapbox.ImageEntry }
  crumbFeatures: FeatureCollection
  mailbox: CrumbMailbox
  getCrumbs: (ids: string[]) => Promise<Crumb[]>
  setMailbox: (m: CrumbMailbox) => void
}

export const useCrumb = (): UseCrumbType => {
  const [mailbox, setMailbox] = useState<CrumbMailbox>("received")
  const { data: crumbMarkers, isError: crumbMarkersIsError, isPending: crumbMarkersPending, error: crumbMarkersError } = useGetCrumbMarkers()
  const userid = useAuthStore(s => s.userId)

  function resolveCrumbMailbox(crumb: Crumb): CrumbMailbox | undefined {
    if (crumb.receiver === userid) return "received"
    else if (crumb.sender === userid) return "sent"
    else if (crumb.saved) return "saved"
  }

  useEffect(() => {
    fetchCrumbs()
  }, [userid, mailbox])

  const [crumbFeatures, setCrumbFeatures] = useState<FeatureCollection>({
    type: 'FeatureCollection',
    features: [
    ],
  })

  const getCrumbs = async (ids: string[]): Promise<Crumb[]> => {
    const crumbs = await GetCrumbsByIds(ids)
    return crumbs
  }

  const newCrumbFeature = (crumbId: string, sender: string, receiver: string, lat: number, lon: number, senderNickname: string, prompt: string, placename: string): Feature<Point, GeoJsonProperties> => {
    return {
      type: 'Feature',
      id: crumbId,
      properties: {
        profilePicture: sender,
        nickname: senderNickname,
        prompt: prompt,
        placename: placename,
        sender: sender,
        receiver: receiver,
      },
      geometry: {
        type: 'Point',
        coordinates: [lon, lat]
      }
    }
  }

  const updateCrumbs = async () => {
    const lastCrumb = await GetLastCrumbDetails();
    const latestCrumb = await getLatestCrumbs(
      userid,
      lastCrumb,
    );

    try {
      if (latestCrumb.crumbs) {
        const newFeatures: Feature<Point>[] = []

        latestCrumb.crumbs.map(crumb => {
          if (resolveCrumbMailbox(crumb) !== mailbox) return
          newFeatures.push(
            newCrumbFeature(
              crumb.id,
              crumb.sender,
              crumb.receiver,
              crumb.latitude,
              crumb.longitude,
              "x",
              "",
              crumb.placename,
            )
          )
        });
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
    const crumbs = await GetAllCrumbs(mailbox)
    const features: Feature<Point>[] = crumbs.map(crumb => (newCrumbFeature(
      crumb.id,
      crumb.sender,
      crumb.receiver,
      crumb.latitude,
      crumb.longitude,
      "x",
      "",
      crumb.placename,
    )));


    setCrumbFeatures({
      type: 'FeatureCollection',
      features
    });
  }

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

  useFocusEffect(
    useCallback(() => {
      updateCrumbs(); // runs immediately on focus

      const interval = setInterval(() => {
        updateCrumbs();
      }, 5000);

      return () => {
        clearInterval(interval);
      };
    }, [userid])
  );

  return {
    crumbImages,
    crumbFeatures,
    mailbox,
    setMailbox,
    getCrumbs
  }
}