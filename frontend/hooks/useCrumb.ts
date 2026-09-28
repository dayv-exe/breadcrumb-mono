import { CrumbsPage, getLatestCrumbs } from "@/api/crumbsApi";
import { getLastCrumbDetails, upsertCrumbs } from "@/api/db/crumbsDb";
import { Crumb, CrumbMailbox } from "@/api/models/crumb";
import type { Feature, FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { useMemo, useState } from "react";
import { useGetAllCrumbs } from "./queries/useLocalDatabase"; // adjust path

type UseCrumbType = {
  crumbFeatures: FeatureCollection
  mailbox: CrumbMailbox
  getCrumbs: (ids: string[]) => Promise<Crumb[]>
  fetchLatestCrumb: (userid: string) => void
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

  const fetchLatestCrumb = async (userid: string) => {
    try {
      const lastCrumb = await getLastCrumbDetails();
      const latest = await getLatestCrumbs(userid, lastCrumb);

      if (hasLatestCrumbs(latest)) {
        await upsertCrumbs(latest.crumbs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return {
    crumbFeatures,
    fetchLatestCrumb,
    mailbox,
    setMailbox,
    getCrumbs,
  }
}