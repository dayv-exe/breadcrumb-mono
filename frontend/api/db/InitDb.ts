import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("app.db");
  }
  return db;
}

export async function InitDb() {
  const db = await getDb()
  // await db.execAsync(`drop table if exists crumbs`)
  await db.execAsync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS crumbs (
  id TEXT PRIMARY KEY NOT NULL,
    lat REAL,
    lon REAL,
    receiver TEXT NOT NULL,
    sender TEXT NOT NULL,
    opened INTEGER NOT NULL DEFAULT 0 CHECK(opened IN (0, 1)),
    time INTEGER NOT NULL,
    placeId TEXT,
    locationType TEXT NOT NULL CHECK(locationType IN ('gps', 'label', 'dropped-pin', 'none')),
    locationAccuracy REAL,
    formattedAddress TEXT
  );
`);
}