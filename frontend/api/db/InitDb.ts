import { LOCAL_DATABASE_NAME } from "@/constants/appConstants";
import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndInit() {
  const db = await SQLite.openDatabaseAsync(LOCAL_DATABASE_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS crumbs (
      id TEXT PRIMARY KEY NOT NULL,
      nonCompositeId TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      sender TEXT NOT NULL,
      receiver TEXT NOT NULL,
      mailbox TEXT NOT NULL CHECK(mailbox IN ('saved', 'sent', 'received')),
      unlocked INTEGER NOT NULL DEFAULT 0 CHECK(unlocked IN (0, 1)),
      time INTEGER NOT NULL,
      locationSelectionManner TEXT NOT NULL CHECK(locationSelectionManner IN ('gps', 'label', 'dropped-pin', 'none')),
      radius REAL,
      formattedAddress TEXT,
      placename TEXT
    );
    CREATE TABLE IF NOT EXISTS places (
      place_id TEXT NOT NULL,
      crumb_id TEXT NOT NULL,
      PRIMARY KEY (place_id, crumb_id),
      FOREIGN KEY (crumb_id) REFERENCES crumbs(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_crumbs_lat_lon ON crumbs(latitude, longitude);
  `);
  return db;
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = openAndInit();
  }
  return dbPromise;
}

export async function logAllTable(table: string) {
  const db = await getDb();
  const rows = await db.getAllAsync(`SELECT * FROM ${table}`);
  console.log(`${table} (${rows.length} rows):`);
  console.log(JSON.stringify(rows, null, 2));
}

export async function DeleteLocalDatabase(onSuccess?: () => void, onFailure?: (e: unknown) => void) {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      await db.closeAsync();
    } catch (e) {
      console.warn("error closing db before delete:", e);
      onFailure?.(e)
    } finally {
      dbPromise = null;
    }
  }

  await SQLite.deleteDatabaseAsync(LOCAL_DATABASE_NAME);
  onSuccess?.()
}