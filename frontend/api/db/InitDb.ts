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
  opened INTEGER NOT NULL,
  time INTEGER NOT NULL
  );
`);

  console.log(await db.getAllAsync("SELECT id,receiver,time FROM crumbs ORDER BY time DESC LIMIT 1"))
}