import { Crumb } from "../models/crumb";
import { getDb } from "./InitDb";

const CHUNK_SIZE = 120


function buildUpsertCrumbsQuery(crumbs: Crumb[]) {
  const placeholders = crumbs.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");

  const values = crumbs.flatMap((crumb) => [
    crumb.id,
    crumb.lat,
    crumb.lon,
    crumb.sender,
    crumb.receiver,
    crumb.opened ? 1 : 0,
    crumb.time,
    crumb.placeId,
    crumb.locationAccuracy,
    crumb.locationType
  ]);
  return {
    sql: `
      INSERT INTO crumbs (
        id,
        lat,
        lon,
        sender,
        receiver,
        opened,
        time,
        placeId,
        locationAccuracy,
        locationType
      )
      VALUES ${placeholders}
      ON CONFLICT(id) DO UPDATE SET
        lat = excluded.lat,
        lon = excluded.lon,
        sender = excluded.sender,
        receiver = excluded.receiver,
        opened = excluded.opened,
        time = excluded.time,
        placeId = excluded.placeId,
        locationAccuracy = excluded.locationAccuracy,
        locationType = excluded.locationType
    `,
    values,
  };
}

export async function UpsertCrumbs(crumbs: Crumb[]) {
  if (!crumbs.length) return;
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < crumbs.length; i += CHUNK_SIZE) {
      const chunk = crumbs.slice(i, i + CHUNK_SIZE);
      const { sql, values } = buildUpsertCrumbsQuery(chunk);

      await db.runAsync(sql, values);
    }
  });
}

export async function GetLastReceivedCrumbDetails(): Promise<Crumb | null> {
  const db = await getDb()
  const c: Crumb | null = await db.getFirstAsync(
    `SELECT id,receiver,time FROM crumbs ORDER BY time DESC LIMIT 1`
  )
  if (!c) {
    return null
  }

  return c
}

export async function GetCrumbsInViewport(
  maxLat: number,
  minLat: number,
  minLon: number,
  maxLon: number
): Promise<Crumb[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Crumb>(
    `SELECT * FROM crumbs 
     WHERE lat <= ? AND lat >= ? AND lon <= ? AND lon >= ? 
     ORDER BY time DESC`,
    [maxLat, minLat, maxLon, minLon]
  );

  return rows
}

export async function GetCrumbsByDistance(
  userLat: number,
  userLon: number
): Promise<(Crumb)[]> {
  const db = await getDb();

  // Pre-compute the longitude scaling factor once.
  // At higher latitudes, a degree of longitude covers less ground than a degree of latitude.
  const lonScale = Math.cos((userLat * Math.PI) / 180);

  const rows = await db.getAllAsync<Crumb>(
    `SELECT *,
      (
        ((lat - ?) * 111320.0) * ((lat - ?) * 111320.0) +
        ((lon - ?) * 111320.0 * ?) * ((lon - ?) * 111320.0 * ?)
      ) AS distanceSq
     FROM crumbs
     WHERE lat IS NOT NULL AND lon IS NOT NULL
     ORDER BY distanceSq ASC`,
    [userLat, userLat, userLon, lonScale, userLon, lonScale]
  );

  return rows
}