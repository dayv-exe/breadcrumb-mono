import { Crumb, CrumbMailbox } from "../models/crumb";
import { distanceMeters, getDb, withDbLock } from "./InitDb";

const CHUNK_SIZE = 120

type SqlValue = string | number | null
type MergeOptions = "overwrite" | "keepIfEmpty" | "fillIfNull"
type UpsertTable<T> = {
  table: string
  columns: string[]
  conflictColumns: string[]
  onConflict?: "update" | "nothing"
  columnMerge?: Record<string, MergeOptions>
  toRows: (item: T) => SqlValue[][]
};

function buildUpsertQuery<T>(config: UpsertTable<T>, rows: SqlValue[][]) {
  const rowPlaceholder = `(${config.columns.map(() => "?").join(", ")})`
  const placeholders = rows.map(() => rowPlaceholder).join(", ")
  const conflictKeys = config.conflictColumns.join(", ")

  let conflictClause: string;
  if (config.onConflict === "nothing") {
    conflictClause = `ON CONFLICT(${conflictKeys}) DO NOTHING`
  } else {
    const updates = config.columns
      .filter((c) => !config.conflictColumns.includes(c))
      .map((c) => {
        const incoming = `excluded.${c}`;
        const existing = `${config.table}.${c}`; // unqualified name = existing row
        switch (config.columnMerge?.[c] ?? "overwrite") {
          case "keepIfEmpty":
            return `${c} = COALESCE(NULLIF(${incoming}, ''), ${existing})`;
          case "fillIfNull":
            return `${c} = COALESCE(${existing}, ${incoming})`;
          default:
            return `${c} = ${incoming}`;
        }
      })
      .join(", ");
    conflictClause = updates
      ? `ON CONFLICT(${conflictKeys}) DO UPDATE SET ${updates}`
      : `ON CONFLICT(${conflictKeys}) DO NOTHING`;
  }

  const sql = `
    INSERT INTO ${config.table} (${config.columns.join(", ")})
    VALUES ${placeholders}
    ${conflictClause};
  `;
  return { sql, values: rows.flat() }
}

const DEFAULT_MAX_PARAMS = 999

async function bulkUpsert<T>(
  items: T[],
  tables: UpsertTable<T>[],
  options: { maxParams?: number } = {},
) {
  if (items.length === 0) return;
  const maxParams = options.maxParams ?? DEFAULT_MAX_PARAMS

  const db = await getDb();
  await withDbLock(() =>
    db.withTransactionAsync(async () => {
      for (const table of tables) {
        const colCount = table.columns.length;
        const maxRowsPerBatch = Math.floor(maxParams / colCount);
        if (maxRowsPerBatch < 1) {
          throw new Error(
            `Table "${table.table}" has ${colCount} columns, exceeding the ` +
            `${maxParams}-parameter limit for a single row.`,
          );
        }

        const rows = items.flatMap(table.toRows);
        for (let i = 0; i < rows.length; i += maxRowsPerBatch) {
          const batch = rows.slice(i, i + maxRowsPerBatch);
          const { sql, values } = buildUpsertQuery(table, batch);
          await db.runAsync(sql, values);
        }
      }
    })
  )
}

export async function upsertCrumbs(userid: string, crumbs: Crumb[]) {
  try {
    await bulkUpsert(crumbs, [
      {
        table: "crumbs",
        columns: [
          "id", "nonCompositeId", "latitude", "longitude", "sender",
          "receiver", "mailbox", "unlocked", "opened", "time",
          "radius", "locationSelectionManner", "formattedAddress", "placename",
        ],
        conflictColumns: ["id"],
        toRows: (crumb) => [[
          crumb.id,
          crumb.nonCompositeId,
          crumb.latitude,
          crumb.longitude,
          crumb.sender,
          crumb.receiver,
          (crumb.sender === userid ? "sent" : "received") as CrumbMailbox,
          crumb.unlocked ? 1 : 0,
          crumb.opened ? 1 : 0,
          crumb.time,
          crumb.radius,
          crumb.locationSelectionManner,
          crumb.formattedAddress,
          crumb.placename,
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
        columns: ["friend_id", "timestamp", "friendshipStartTimestamp"],
        conflictColumns: ["friend_id"],
        toRows: (crumb => [[
          crumb.sender !== userid ? crumb.sender : crumb.receiver,
          crumb.time,
          crumb.time,
        ]]),
        columnMerge: {
          friendshipStartTimestamp: "fillIfNull"
        }
      },
    ])
  } catch (error) {
    console.error("Failed to upsert crumbs reason: ", error)
  }
}

export async function upsertChats(otherUserid: string, timestamp: string) {
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
          "friend_id", "timestamp", "friendshipStartTimestamp"
        ],
        toRows: (chat) => [[
          chat.friend_id,
          chat.timestamp,
          chat.timestamp,
        ]],
        columnMerge: {
          friendshipStartTimestamp: "fillIfNull",
        }
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
  if (placeIds.length === 0) return [];

  const db = await getDb();
  const placeIdPlaceholders = placeIds.map(() => "?").join(",");

  const rows = await withDbLock(() =>
    db.getAllAsync<{ crumb_id: string }>(
      `SELECT DISTINCT p.crumb_id
       FROM places p
       JOIN crumbs c ON c.id = p.crumb_id
      WHERE p.place_id IN (${placeIdPlaceholders})
        AND c.unlocked = 0`,
      placeIds
    )
  )

  const toUnlock = rows.map((r) => r.crumb_id);
  if (toUnlock.length === 0) return [];

  await withDbLock(() =>
    db.withTransactionAsync(async () => {
      for (let i = 0; i < toUnlock.length; i += CHUNK_SIZE) {
        const crumbIds = toUnlock.slice(i, i + CHUNK_SIZE);
        const ph = crumbIds.map(() => "?").join(",");

        await db.runAsync(
          `UPDATE crumbs SET unlocked = 1 WHERE id IN (${ph})`,
          crumbIds
        );
        // await db.runAsync(
        //   `DELETE FROM places WHERE crumb_id IN (${ph})`,
        //   crumbIds
        // );
      }
    })
  )

  return toUnlock;
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

export async function getCrumbsWith(otherUserid: string): Promise<Crumb[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<Crumb>(
    `SELECT * FROM crumbs
     WHERE sender = ? OR receiver = ?
     ORDER BY time ASC`,
    [otherUserid, otherUserid]
  )

  return rows
}

export async function getCrumbFeed(): Promise<string[]> {
  const db = await getDb()
  const rows = await db.getAllAsync<{ friend_id: string }>(
    `SELECT friend_id FROM chats
     ORDER BY timestamp DESC`,
  )

  return rows.map(c => c.friend_id)
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