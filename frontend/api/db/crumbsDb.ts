import type { Position } from "geojson";
import { Crumb, CrumbMailbox } from "../models/crumb";
import { getDb } from "./InitDb";

const CHUNK_SIZE = 120


function buildUpsertCrumbsQuery(userid: string, crumbs: Crumb[]) {
  const crumbPlaceholders = crumbs
    .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .join(", ");

  const places = crumbs.flatMap((crumb) =>
    crumb.placeId
      .split(",")
      .filter(Boolean)
      .map((place) => [place, crumb.id])
  );

  const placesPlaceholders = places
    .map(() => "(?, ?)")
    .join(", ");

  const crumbValues = crumbs.flatMap((crumb) => [
    crumb.id,
    crumb.nonCompositeId,
    crumb.latitude,
    crumb.longitude,
    crumb.sender,
    crumb.receiver,
    (crumb.saved
      ? "saved"
      : crumb.receiver === userid
        ? "received"
        : "sent") as CrumbMailbox,
    crumb.unlocked ? 1 : 0,
    crumb.time,
    crumb.radius,
    crumb.locationSelectionManner,
    crumb.formattedAddress,
    crumb.placename
  ]);

  return {
    crumbSql: `
      INSERT INTO crumbs (
        id,
        nonCompositeId,
        latitude,
        longitude,
        sender,
        receiver,
        mailbox,
        unlocked,
        time,
        radius,
        locationSelectionManner,
        formattedAddress,
        placename
      )
      VALUES ${crumbPlaceholders}
      ON CONFLICT(id) DO UPDATE SET
        nonCompositeId = excluded.nonCompositeId,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        sender = excluded.sender,
        receiver = excluded.receiver,
        mailbox = excluded.mailbox,
        unlocked = excluded.unlocked,
        time = excluded.time,
        radius = excluded.radius,
        locationSelectionManner = excluded.locationSelectionManner,
        formattedAddress = excluded.formattedAddress,
        placename = excluded.placename;
    `,

    placesSql: `
      INSERT INTO places (
        place_id,
        crumb_id
      )
      VALUES ${placesPlaceholders}
      ON CONFLICT(place_id, crumb_id) DO NOTHING;
    `,

    crumbValues,
    placesValues: places.flat()
  };
}

export async function UpsertCrumbs(userid: string, crumbs: Crumb[]) {
  if (crumbs.length === 0) return;
  try {
    const db = await getDb();

    await db.withTransactionAsync(async () => {
      for (let i = 0; i < crumbs.length; i += CHUNK_SIZE) {
        const chunk = crumbs.slice(i, i + CHUNK_SIZE);
        const { crumbSql, placesSql, crumbValues, placesValues } = buildUpsertCrumbsQuery(userid, chunk);

        await db.runAsync(crumbSql, crumbValues);
        if (placesValues.length > 0) {
          await db.runAsync(placesSql, placesValues);
        }
      }
    });
  } catch (e) {
    console.log("the err is indeed:", e)
  }
}

export async function GetLastCrumbDetails(): Promise<Crumb | null> {
  try {
    const db = await getDb();
    const c = await db.getFirstAsync<Crumb>(
      `SELECT id, receiver, sender, time FROM crumbs ORDER BY time DESC LIMIT 1`,
    );
    return c ?? null
  } catch (e) {
    console.log("THE ERROR IS INDEED: ", e);
    return null
  }
}

export async function GetCrumbsInViewport(
  ne: Position,
  sw: Position,
  sent?: boolean,
): Promise<Crumb[]> {
  const [neLon, neLat] = ne;
  const [swLon, swLat] = sw;

  const db = await getDb();

  const crossesAntimeridian = neLon < swLon;

  const lonClause = crossesAntimeridian
    ? "(longitude >= ? OR longitude <= ?)"  // wraps the antimeridian
    : "(longitude >= ? AND longitude <= ?)";

  const rows = await db.getAllAsync<Crumb>(
    `SELECT * FROM crumbs 
     WHERE latitude <= ? AND latitude >= ? AND ${lonClause} AND sent = ${sent ? 1 : 0}
     ORDER BY time DESC`,
    [neLat, swLat, swLon, neLon]
  );

  return rows;
}

export async function GetCrumbsByDistance(
  userLat: number,
  userLon: number,
  sent?: boolean
): Promise<(Crumb)[]> {
  const db = await getDb();

  const lonScale = Math.cos((userLat * Math.PI) / 180);

  const rows = await db.getAllAsync<Crumb>(
    `SELECT *,
      (
        ((latitude - ?) * 111320.0) * ((latitude - ?) * 111320.0) +
        ((longitude - ?) * 111320.0 * ?) * ((longitude - ?) * 111320.0 * ?)
      ) AS distanceSq
     FROM crumbs
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND sent = ${sent ? 1 : 0}
     ORDER BY distanceSq ASC`,
    [userLat, userLat, userLon, lonScale, userLon, lonScale]
  );

  return rows
}

export async function GetAllCrumbs(mailbox: CrumbMailbox): Promise<Crumb[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Crumb>(
    `SELECT * FROM crumbs
     WHERE mailbox = ?
     ORDER BY time DESC`,
    [mailbox]
  );

  return rows
}

export async function GetCrumbsByIds(ids: string[]): Promise<Crumb[]> {
  if (ids.length < 1) return []
  const db = await getDb()
  const placeholders = ids.map(() => "?").join(",")

  const rows = await db.getAllAsync<Crumb>(
    `SELECT * FROM crumbs
      WHERE id IN (${placeholders})`,
    ids
  )

  return rows
}

export async function GetGroupedCrumbsByIds(ids: string[], groupBySender: boolean): Promise<Record<string, Crumb[]>> {
  if (ids.length < 1) return {}
  const db = await getDb()
  const placeholders = ids.map(() => "?").join(",")

  const rows = await db.getAllAsync<Crumb>(
    `SELECT * FROM crumbs
      WHERE id IN (${placeholders})`,
    ids
  )

  return rows.reduce<Record<string, Crumb[]>>((groups, crumb) => {
    const key = crumb[groupBySender ? "sender" : "receiver"]
    if (!groups[key]) groups[key] = []
    groups[key].push(crumb)
    return groups
  }, {})
}

export async function GetRecentCrumbedFriendIds(currentUserid: string): Promise<Set<string>> {
  const db = await getDb()

  const rows = await db.getAllAsync<{ otherUser: string }>(
    `SELECT DISTINCT sender AS otherUser
   FROM crumbs
   WHERE receiver = ? AND sender != ?`,
    [currentUserid, currentUserid]
  )

  return new Set(rows.map(r => r.otherUser))
}

export async function GetCrumbFromLocal(crumbId: string): Promise<Crumb | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Crumb>(
    `SELECT * FROM crumbs  
     WHERE id = ?`,
    [crumbId]
  );

  return row
}