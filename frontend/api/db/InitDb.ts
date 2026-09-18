import { RADIUS_OF_EARTH_M } from "@/constants/appConstants";
import { useAuthStore } from "@/utils/authStore";
import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

let txChain: Promise<unknown> = Promise.resolve();

export const CHUNK_SIZE = 120

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

export async function bulkUpsert<T>(
  items: T[],
  tables: UpsertTable<T>[],
  options: { maxParams?: number } = {},
) {
  if (items.length === 0) return;
  const maxParams = options.maxParams ?? DEFAULT_MAX_PARAMS

  await withDbLock(async () => {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
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
  })
}


export function unsubscribeFromCurrentDbFile() {
  dbPromise = null
}

function getDbName() {
  const userid = useAuthStore.getState().userid;
  if (!userid) throw new Error("Cannot open DB: no authenticated user");
  return `${userid}.db`;
}

async function openAndInit() {
  const db = await SQLite.openDatabaseAsync(getDbName(), {
    enableChangeListener: true,
  });
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS crumbs (
      id TEXT PRIMARY KEY NOT NULL,
      nonCompositeId TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      sender TEXT NOT NULL,
      receiver TEXT NOT NULL,
      mailbox TEXT NOT NULL CHECK(mailbox IN ('sent', 'received')),
      place_unlocked INTEGER NOT NULL DEFAULT 0 CHECK(place_unlocked IN (0, 1)),
      distance_unlocked INTEGER NOT NULL DEFAULT 0 CHECK(distance_unlocked IN (0, 1)),
      opened INTEGER NOT NULL DEFAULT 0 CHECK(opened IN (0, 1)),
      time INTEGER NOT NULL,
      locationSelectionManner TEXT NOT NULL CHECK(locationSelectionManner IN ('gps', 'label', 'dropped-pin', 'none')),
      radius REAL,
      formattedAddress TEXT,
      placename TEXT,
      otherUser TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS places (
      place_id TEXT NOT NULL,
      crumb_id TEXT NOT NULL,
      PRIMARY KEY (place_id, crumb_id),
      FOREIGN KEY (crumb_id) REFERENCES crumbs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chats (
      friend_id TEXT PRIMARY KEY NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_crumbs_lockable
      ON crumbs(latitude)
      WHERE place_unlocked = 0 AND distance_unlocked;

    CREATE INDEX IF NOT EXISTS idx_crumbs_mailbox_time
      ON crumbs(mailbox, time);

    CREATE INDEX IF NOT EXISTS idx_places_crumb
      ON places(crumb_id);
  `);
  return db;
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = openAndInit().catch((e) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

export function withDbLock<T>(task: () => Promise<T>): Promise<T> {
  const run = txChain.then(task, task);   // run regardless of prior outcome
  txChain = run.then(() => { }, () => { }); // swallow errors so one failure can't poison the queue
  return run;
}

export function distanceMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = Math.PI / 180;
  const dLat = (bLat - aLat) * toRad;
  const dLon = (bLon - aLon) * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * toRad) * Math.cos(bLat * toRad) * Math.sin(dLon / 2) ** 2;
  return RADIUS_OF_EARTH_M * 2 * Math.asin(Math.sqrt(h));
}

export async function logAllTable(table: string) {
  const db = await getDb();
  const rows = await db.getAllAsync(`SELECT * FROM ${table}`);
  console.log(`${table} (${rows.length} rows):`);
  console.log(JSON.stringify(rows, null, 2));
}

export async function DeleteLocalDatabase(onSuccess?: () => void, onFailure?: (e: unknown) => void) {
  withDbLock(async () => {
    if (dbPromise) {
      try {
        const db = await dbPromise;
        await db.closeAsync();
      } catch (e) {
        console.warn("error closing db before delete:", e);
        onFailure?.(e);
      } finally {
        dbPromise = null;
      }
    }

    await SQLite.deleteDatabaseAsync(getDbName());
    onSuccess?.();
  })
}