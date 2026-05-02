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
  // await db.execAsync(`drop table crumbs`)
  await db.execAsync(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS crumbs (
  id TEXT PRIMARY KEY NOT NULL,
  lat REAL,
  lon REAL,
  receiver TEXT NOT NULL,
  sender TEXT NOT NULL,
  opened BOOL NOT NULL,
  time TEXT NOT NULL
  );
`);

  console.log(await db.getAllAsync("select * from crumbs"))
}