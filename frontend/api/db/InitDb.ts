import { LOCAL_DATABASE_NAME } from "@/constants/appConstants";
import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndInit() {
  console.log("init db...");
  const db = await SQLite.openDatabaseAsync(LOCAL_DATABASE_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS crumbs (
      id TEXT PRIMARY KEY NOT NULL,
      lat REAL,
      lon REAL,
      sender TEXT NOT NULL,
      receiver TEXT NOT NULL,
      sent INTEGER NOT NULL DEFAULT 0 CHECK(opened IN (0, 1)),
      opened INTEGER NOT NULL DEFAULT 0 CHECK(opened IN (0, 1)),
      time INTEGER NOT NULL,
      locationType TEXT NOT NULL CHECK(locationType IN ('gps', 'label', 'dropped-pin', 'none')),
      locationAccuracy REAL,
      formattedAddress TEXT,
      placename TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_crumbs_lat_lon ON crumbs(lat, lon);
  `);
  return db;
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = openAndInit();
  }
  return dbPromise;
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