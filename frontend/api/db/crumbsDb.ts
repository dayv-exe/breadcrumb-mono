import { Crumb, CrumbMailbox } from "../models/crumb";
import { distanceMeters, getDb } from "./InitDb";

const CHUNK_SIZE = 120;

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
    (crumb.sender === userid ? "sent" : "received") as CrumbMailbox,
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
    console.log("the err is indeed:", e);
  }
}

export async function GetLastCrumbDetails(): Promise<Crumb | null> {
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

export async function unlockNearbyCrumbsByDistance(
  lat: number,
  lon: number,
  radius: number,
): Promise<string[]> {
  const db = await getDb();

  const candidates = await db.getAllAsync<Crumb>(`
    SELECT id, latitude, longitude, radius
    FROM crumbs
    WHERE unlocked = 0
  `);

  const toUnlock = candidates
    .filter(
      (c) =>
        distanceMeters(lat, lon, c.latitude, c.longitude) <=
        radius + (c.radius ?? 0),
    )
    .map((c) => c.id);

  if (toUnlock.length === 0) return [];

  for (let i = 0; i < toUnlock.length; i += CHUNK_SIZE) {
    const chunk = toUnlock.slice(i, i + CHUNK_SIZE);
    const placeholders = chunk.map(() => "?").join(",");
    await db.runAsync(
      `UPDATE crumbs SET unlocked = 1 WHERE id IN (${placeholders})`,
      chunk,
    );
  }

  return toUnlock;
}

export async function unlockNearbyCrumbsByPlace(
  placeIds: string[]
): Promise<string[]> {
  const db = await getDb();
  const placeholders = placeIds.map(() => "?").join(",")

  const toUnlock = await db.getAllAsync<string>(`
    SELECT crumb_id
    FROM places
    WHERE place_id = ${placeholders}
  `, placeIds);

  if (toUnlock.length === 0) return [];

  const CHUNK = 500;
  for (let i = 0; i < toUnlock.length; i += CHUNK) {
    const chunk = toUnlock.slice(i, i + CHUNK);
    const ph = chunk.map(() => "?").join(",");
    await db.runAsync(
      `UPDATE crumbs SET unlocked = 1 WHERE id IN (${ph})`,
      chunk,
    );
  }

  return toUnlock;
}

export async function GetAllCrumbs(mailbox: CrumbMailbox): Promise<Crumb[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Crumb>(
    `SELECT * FROM crumbs
     WHERE mailbox = ?
     ORDER BY time DESC`,
    [mailbox]
  );

  return rows;
}

export async function GetCrumbFromLocal(crumbId: string): Promise<Crumb | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Crumb>(
    `SELECT * FROM crumbs
     WHERE id = ?`,
    [crumbId]
  );

  return row;
}