import type { Position } from "geojson";
import { Crumb, CrumbMailbox } from "../models/crumb";
import { getDb } from "./InitDb";

const CHUNK_SIZE = 120


function buildUpsertCrumbsQuery(crumbs: Crumb[]) {
  const placeholders = crumbs.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");

  // split place ids into individual db items
  // so we can query by place id
  // then query by radius

  const values = crumbs.flatMap((crumb) => [
    crumb.id,
    crumb.latitude,
    crumb.longitude,
    crumb.sender,
    crumb.receiver,
    (crumb.private ? "private" : crumb.sent ? "sent" : "received") as CrumbMailbox,
    crumb.unlocked,
    crumb.time,
    crumb.radius,
    crumb.locationSelectionManner,
    crumb.formattedAddress,
    crumb.placename
  ]);
  return {
    sql: `
      INSERT INTO crumbs (
        id,
        lat,
        lon,
        sender,
        receiver,
        mailbox,
        opened,
        time,
        locationAccuracy,
        locationType,
        formattedAddress,
        placename
      )
      VALUES ${placeholders}
      ON CONFLICT(id) DO UPDATE SET
        lat = excluded.lat,
        lon = excluded.lon,
        sender = excluded.sender,
        receiver = excluded.receiver,
        mailbox = excluded.mailbox,
        opened = excluded.opened,
        time = excluded.time,
        locationAccuracy = excluded.locationAccuracy,
        locationType = excluded.locationType,
        formattedAddress = excluded.formattedAddress,
        placename = excluded.placename
    `,
    values,
  };
}

export async function UpsertCrumbs(crumbs: Crumb[]) {
  if (crumbs.length === 0) return;
  try {
    const db = await getDb();

    await db.withTransactionAsync(async () => {
      for (let i = 0; i < crumbs.length; i += CHUNK_SIZE) {
        const chunk = crumbs.slice(i, i + CHUNK_SIZE);
        const { sql, values } = buildUpsertCrumbsQuery(chunk);

        await db.runAsync(sql, values);
      }
    });
  } catch (e) {
    console.log("the err is indeed:", e)
  }
}

export async function GetLastCrumbDetails(mailbox: CrumbMailbox): Promise<Crumb | null> {
  try {
    const db = await getDb();
    const c = await db.getFirstAsync<Crumb>(
      `SELECT id, receiver, sender, time FROM crumbs WHERE mailbox = ? ORDER BY time DESC LIMIT 1`,
      [mailbox]
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
    ? "(lon >= ? OR lon <= ?)"  // wraps the antimeridian
    : "(lon >= ? AND lon <= ?)";

  const rows = await db.getAllAsync<Crumb>(
    `SELECT * FROM crumbs 
     WHERE lat <= ? AND lat >= ? AND ${lonClause} AND sent = ${sent ? 1 : 0}
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
        ((lat - ?) * 111320.0) * ((lat - ?) * 111320.0) +
        ((lon - ?) * 111320.0 * ?) * ((lon - ?) * 111320.0 * ?)
      ) AS distanceSq
     FROM crumbs
     WHERE lat IS NOT NULL AND lon IS NOT NULL AND sent = ${sent ? 1 : 0}
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

export async function GetCrumbFromLocal(crumbId: string): Promise<Crumb | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Crumb>(
    `SELECT * FROM crumbs  
     WHERE id = ?`,
    [crumbId]
  );

  return row
}