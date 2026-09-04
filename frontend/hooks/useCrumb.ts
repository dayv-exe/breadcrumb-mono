import { CrumbsPage, getLatestCrumbs } from "@/api/crumbsApi";
import { getLastCrumbDetails, upsertCrumbs } from "@/api/db/crumbsDb";
import { Crumb, CrumbMailbox } from "@/api/models/crumb";
import { useAuthStore } from "@/utils/authStore";
import { useFocusEffect } from "expo-router";
import type { Feature, FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { useCallback, useMemo, useState } from "react";
import { useGetAllCrumbs } from "./queries/useCrumbDbQueries"; // adjust path

type UseCrumbType = {
  crumbFeatures: FeatureCollection
  mailbox: CrumbMailbox
  getCrumbs: (ids: string[]) => Promise<Crumb[]>
  setMailbox: (m: CrumbMailbox) => void
}

// Pure — hoisted out of the component so it's stable and safe in useMemo deps.
function newCrumbFeature(
  crumbId: string,
  sender: string,
  receiver: string,
  lat: number,
  lon: number,
  senderNickname: string,
  prompt: string,
  placename: string,
): Feature<Point, GeoJsonProperties> {
  return {
    type: 'Feature',
    id: crumbId,
    properties: {
      profilePicture: sender,
      nickname: senderNickname,
      prompt,
      placename,
      sender,
      receiver,
    },
    geometry: {
      type: 'Point',
      coordinates: [lon, lat],
    },
  }
}

export const useCrumb = (): UseCrumbType => {
  const [mailbox, setMailbox] = useState<CrumbMailbox>("received")
  const userid = useAuthStore(s => s.userId)

  const { data: crumbs = [] } = useGetAllCrumbs(mailbox)

  const crumbFeatures = useMemo<FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: crumbs
      .map(crumb => newCrumbFeature(
        crumb.id,
        crumb.sender,
        crumb.receiver,
        crumb.latitude,
        crumb.longitude,
        "x",
        "",
        crumb.placename,
      )),
  }), [crumbs])

  const getCrumbs = async (ids: string[]): Promise<Crumb[]> => {
    return []
  }

  const hasLatestCrumbs = (latest: CrumbsPage) => {
    return latest.crumbs?.length
  }

  useFocusEffect(
    useCallback(() => {
      const updateCrumbs = async () => {
        try {
          const lastCrumb = await getLastCrumbDetails();
          const latest = await getLatestCrumbs(userid, lastCrumb);

          if (hasLatestCrumbs(latest)) {
            console.log("has latest crumb")
            await upsertCrumbs(userid, latest.crumbs);
          }
        } catch (err) {
          console.error(err);
        }
      };

      updateCrumbs();
      const interval = setInterval(updateCrumbs, 5000);

      return () => clearInterval(interval);
    }, [userid])
  );
  return {
    crumbFeatures,
    mailbox,
    setMailbox,
    getCrumbs,
  }
}