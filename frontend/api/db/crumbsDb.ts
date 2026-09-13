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
          "receiver", "mailbox", "unlocked", "opened", "time",
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
  const rows = await db.getAllAsync<Crumb>(
    `SELECT * FROM crumbs
     WHERE otherUser = ?`,
    [otherUserid]
  )

  return rows
    .map((crumb) => ({
      crumb,
      dist: distanceMeters(userLat, userLon, crumb.latitude, crumb.longitude),
    }))
    .sort((a, b) => a.dist - b.dist)
    .map((x) => x.crumb)
}

export type FeedItem = {
  action: string
  crumbs: Crumb[]
}
export async function getCrumbFeed(): Promise<Map<string, FeedItem>> {
  const db = await getDb()
  const rows = await db.getAllAsync<Crumb & { friend_id: string, action: string }>(
    `
    SELECT
      chats.friend_id,
      chats.action,
      crumbs.id,
      crumbs.sender,
      crumbs.receiver,
      crumbs.latitude,
      crumbs.longitude,
      crumbs.unlocked,
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
    if (row.id === null || !row.unlocked) continue

    feed.get(row.friend_id)!.crumbs.push({
      id: row.id,
      sender: row.sender,
      receiver: row.receiver,
      latitude: row.latitude,
      longitude: row.longitude,
      unlocked: Boolean(row.unlocked),
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