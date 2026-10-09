import { CrumbsPage, getLatestCrumbs } from "@/api/crumbsApi";
import { getLastCrumbDetails, upsertCrumbs } from "@/api/db/crumbsDb";
import { Crumb, CrumbMailbox } from "@/api/models/crumb";
import { getInitials } from "@/utils/getInitials";
import Mapbox from "@rnmapbox/maps";
import type { Feature, FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { useMemo, useState } from "react";
import { useGetAllCrumbs } from "./queries/useLocalDatabase"; // adjust path
import { useCrumbMarkers } from "./useCrumbMarkers";

type CrumbImages = { [key: string]: Mapbox.ImageEntry }

type UseCrumbType = {
  crumbFeatures: FeatureCollection
  crumbImages: CrumbImages
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
  nicknameInitials: string,
  thumbnailName: string,
  prompt: string,
  placename: string,
): Feature<Point, GeoJsonProperties> {
  return {
    type: 'Feature',
    id: crumbId,
    properties: {
      profilePicture: thumbnailName,
      nickname: nicknameInitials,
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

  const ids = useMemo(
    () => Array.from(new Set(crumbs.map(c => mailbox === "received" ? c.sender : c.receiver))),
    [crumbs, mailbox]
  )
  const { markers } = useCrumbMarkers(ids)

  const crumbImages = useMemo<CrumbImages>(() => {
    const images: CrumbImages = {}
    markers.forEach((marker, userId) => {
      if (marker.thumbnail) {
        images[userId] = { uri: marker.thumbnail }
      }
    })

    return images
  }, [markers])

  const crumbFeatures = useMemo<FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: crumbs.map((crumb, index) => {
      const marker = markers.get(mailbox === "received" ? crumb.sender : crumb.receiver)
      const otherUserid = mailbox === "received" ? crumb.sender : crumb.receiver

      const feature = newCrumbFeature(
        crumb.id,
        crumb.sender,
        crumb.receiver,
        crumb.latitude,
        crumb.longitude,
        getInitials(marker?.nickname ?? "").toUpperCase() ?? "x",
        otherUserid,
        "",
        crumb.placename,
      )

      feature.properties!.latestPicture = String(index).padStart(6, "0") + otherUserid
      feature.properties!.latestInitials = String(index).padStart(6, "0") + getInitials(marker?.nickname ?? "").toUpperCase()
      return feature
    }),
  }), [crumbs, mailbox, markers])

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
    crumbImages,
    fetchLatestCrumb,
    mailbox,
    setMailbox,
    getCrumbs,
  }
}