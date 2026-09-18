// TODO VERY IMPORTANTÈ: separate this functions into different files.

import { Coordinates } from "@/utils/useLocationStore";
import { Crumb, CrumbMailbox } from "../models/crumb";
import { bulkUpsert, CHUNK_SIZE, distanceMeters, getDb, withDbLock } from "./InitDb";

type iCandidate = Crumb & {
  place_unlocked: 0 | 1
  distance_unlocked: 0 | 1
}

export function resolveCrumbOtherUser(crumb: Crumb): string {
  return crumb.mailbox === "received" ? crumb.sender : crumb.receiver
}

export async function upsertCrumbs(crumbs: Crumb[]) {
  try {
    await bulkUpsert(crumbs, [
      {
        table: "crumbs",
        columns: [
          "id", "nonCompositeId", "latitude", "longitude", "sender",
          "receiver", "mailbox", "place_unlocked", "distance_unlocked", "opened", "time",
          "radius", "locationSelectionManner", "formattedAddress", "placename", "otherUser",
        ],
        conflictColumns: ["id"],
        toRows: (crumb) => [[
          crumb.id,
          crumb.nonCompositeId,
          crumb.latitude,
          crumb.longitude,
          crumb.sender,
          crumb.receiver,
          crumb.mailbox,
          crumb.unlocked ? 1 : 0,
          crumb.unlocked ? 1 : 0,
          crumb.opened ? 1 : 0,
          crumb.time,
          crumb.radius,
          crumb.locationSelectionManner,
          crumb.formattedAddress,
          crumb.placename,
          resolveCrumbOtherUser(crumb),
        ]],
      },
      {
        table: "places",
        columns: ["place_id", "crumb_id"],
        conflictColumns: ["place_id", "crumb_id"],
        toRows: (crumb) =>
          crumb.placeId
            .split(",")
            .filter(Boolean)
            .map((place) => [place, crumb.id]),
      },
      {
        // move friend to the top of the chat list when a new crumb is shared with them
        table: "chats",
        columns: ["friend_id", "action", "timestamp"],
        conflictColumns: ["friend_id"],
        toRows: (crumb => [[
          resolveCrumbOtherUser(crumb),
          crumb.mailbox,
          crumb.time,
        ]]),
      },
    ])
  } catch (error) {
    console.error("Failed to upsert crumbs reason: ", error)
  }
}

export async function upsertChats(otherUserid: string, action: string, timestamp: string) {
  const chat: { friend_id: string, timestamp: string } = {
    friend_id: otherUserid,
    timestamp: timestamp,
  }
  try {
    await bulkUpsert([chat], [
      {
        table: "chats",
        conflictColumns: ["friend_id"],
        onConflict: "update",
        columns: [
          "friend_id", "action", "timestamp",
        ],
        toRows: (chat) => [[
          chat.friend_id,
          action,
          chat.timestamp,
        ]],
      }
    ])
  } catch (error) {
    console.error("failed to upsert chats! REASON: ", error)
  }
}

export async function getLastCrumbDetails(): Promise<Crumb | null> {
  try {
    const db = await getDb();
    const c = await db.getFirstAsync<Crumb>(
      `SELECT id, receiver, sender, time FROM crumbs ORDER BY time DESC LIMIT 1`,
    );
    return c ?? null;
  } catch (e) {
    console.log("THE ERROR IS INDEED: ", e);
    return null;
  }
}

export async function getAllCrumbs(mailbox: CrumbMailbox): Promise<Crumb[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<Crumb>(
    `SELECT * FROM crumbs
     WHERE mailbox = ?
     ORDER BY time DESC`,
    [mailbox]
  )

  return rows
}

export async function getCrumbsWith(
  otherUserid: string,
  userLat: number,
  userLon: number
): Promise<Crumb[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<iCandidate>(
    `SELECT * FROM crumbs
     WHERE otherUser = ?`,
    [otherUserid]
  )

  return rows
    .map((candidate) => {
      const crumb: Crumb = { ...candidate, unlocked: candidate.place_unlocked === 1 || candidate.distance_unlocked === 1 }
      return {
        crumb,
        dist: distanceMeters(userLat, userLon, crumb.latitude, crumb.longitude),
      }
    })
    .sort((a, b) => a.dist - b.dist)
    .map((x) => x.crumb)

}

export type LockChange = { unlocked: Crumb[]; locked: Crumb[] }

async function applyFlag(
  db: Awaited<ReturnType<typeof getDb>>,
  column: "distance_unlocked" | "place_unlocked",
  changes: { id: string; val: 0 | 1 }[],
) {
  for (const val of [0, 1] as const) {
    const ids = changes.filter((c) => c.val === val).map((c) => c.id)
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const batch = ids.slice(i, i + CHUNK_SIZE)
      const ph = batch.map(() => "?").join(",")
      await db.runAsync(`UPDATE crumbs SET ${column} = ${val} WHERE id IN (${ph})`, batch)
    }
  }
}

export async function reconcileCrumbLocks(
  coords: Coordinates,
  nearbyPlaceIds?: string[],
): Promise<LockChange> {
  const { latitude, longitude, accuracy } = coords
  const unlocked: Crumb[] = []
  const locked: Crumb[] = []

  try {
    await withDbLock(async () => {
      const db = await getDb()
      await db.withTransactionAsync(async () => {
        const candidates = await db.getAllAsync<iCandidate>(`SELECT * FROM crumbs WHERE mailbox = 'received'`)
        if (candidates.length === 0) return

        // crumbs nearby by
        const nearbyCrumbIds = new Set<string>()
        if (nearbyPlaceIds && nearbyPlaceIds.length > 0) {
          for (let i = 0; i < nearbyPlaceIds.length; i += CHUNK_SIZE) {
            const batch = nearbyPlaceIds.slice(i, i + CHUNK_SIZE)
            const ph = batch.map(() => "?").join(",")
            const rows = await db.getAllAsync<{ crumb_id: string }>(
              `SELECT DISTINCT crumb_id FROM places WHERE place_id IN (${ph})`,
              batch,
            )
            rows.forEach((r) => nearbyCrumbIds.add(r.crumb_id))
          }
        }

        const setDistance: { id: string; val: 0 | 1 }[] = []
        const setPlace: { id: string; val: 0 | 1 }[] = []

        for (const candidate of candidates) {
          const dist = distanceMeters(latitude, longitude, candidate.latitude, candidate.longitude)
          const wantDistance: 0 | 1 =
            dist < (accuracy ?? 0) + (candidate.radius ?? 0) ? 1 : 0
          // keep old place flag if no place provided
          const wantPlace: 0 | 1 =
            nearbyPlaceIds === undefined
              ? (candidate.place_unlocked as 0 | 1)
              : nearbyCrumbIds.has(candidate.id) ? 1 : 0

          const wasUnlocked = candidate.distance_unlocked === 1 || candidate.place_unlocked === 1
          const willUnlock = wantDistance === 1 || wantPlace === 1


          if (wantDistance !== candidate.distance_unlocked) {
            setDistance.push({ id: candidate.id, val: wantDistance })
            console.log(`a crumb will be ${wantDistance === 1 ? "unlocked" : "locked"} by distance`)
          }
          if (wantPlace !== candidate.place_unlocked) {
            setPlace.push({ id: candidate.id, val: wantPlace })
            console.log(`a crumb will be ${wantDistance === 1 ? "unlocked" : "locked"} by place`)
          }

          if (!wasUnlocked && willUnlock) {
            unlocked.push(candidate)
          }
          if (wasUnlocked && !willUnlock) {
            // locked.push(candidate)
          }
        }

        await applyFlag(db, "distance_unlocked", setDistance)
        await applyFlag(db, "place_unlocked", setPlace)
      })
    })
  } catch (error) {
    console.error("Failed to reconcile crumb locks, reason: ", error)
  }

  return { unlocked, locked }
}

export type FeedItem = {
  action: string
  crumbs: Crumb[]
}
export async function getCrumbFeed(): Promise<Map<string, FeedItem>> {
  const db = await getDb()
  const rows = await db.getAllAsync<Crumb & { friend_id: string, action: string, place_unlocked: 0 | 1, distance_unlocked: 0 | 1, }>(
    `
    SELECT
      chats.friend_id,
      chats.action,
      crumbs.id,
      crumbs.sender,
      crumbs.receiver,
      crumbs.latitude,
      crumbs.longitude,
      crumbs.place_unlocked,
      crumbs.distance_unlocked,
      crumbs.opened,
      crumbs.formattedAddress,
      crumbs.placename,
      crumbs.time
    FROM chats
    LEFT JOIN crumbs ON chats.friend_id IN (crumbs.sender, crumbs.receiver)
    ORDER BY chats.timestamp DESC
    `,
  )

  const feed = new Map<string, FeedItem>()
  for (const row of rows) {
    if (row.friend_id === null) continue
    if (!feed.has(row.friend_id)) feed.set(row.friend_id, {
      action: row.action,
      crumbs: []
    })
    if (row.id === null || (row.distance_unlocked === 0 && row.place_unlocked === 0)) continue
    const crumb: Crumb = {
      id: row.id,
      sender: row.sender,
      receiver: row.receiver,
      latitude: row.latitude,
      longitude: row.longitude,
      unlocked: row.place_unlocked === 1 || row.distance_unlocked === 1,
      opened: Boolean(row.opened),
      formattedAddress: row.formattedAddress,
      placename: row.placename,
      saved: false,
      time: row.time,
      geohash: "",
      locationSelectionManner: "gps",
      media: [],
      nonCompositeId: "",
      placeId: "",
      radius: 0,
      mailbox: row.mailbox,
    }

    feed.get(row.friend_id)!.crumbs.push(crumb)
    feed.forEach((item, key) => {
      console.log("item: ", item)
    })
  }

  return feed
}

export async function getCrumbFromLocal(crumbId: string): Promise<Crumb | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Crumb>(
    `SELECT * FROM crumbs
     WHERE id = ?`,
    [crumbId]
  );

  return row;
}