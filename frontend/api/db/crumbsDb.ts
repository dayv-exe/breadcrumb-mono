import { Crumb } from "../models/crumb";
import { getDb } from "./InitDb";

const CHUNK_SIZE = 120


function buildUpsertCrumbsQuery(crumbs: Crumb[]) {
  const placeholders = crumbs.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");

  const values = crumbs.flatMap((crumb) => [
    crumb.id,
    crumb.lat,
    crumb.lon,
    crumb.sender,
    crumb.receiver,
    crumb.opened,
    crumb.time,
  ]);
  return {
    sql: `
      INSERT INTO crumbs (
        id,
        lat,
        lon,
        sender,
        receiver,
        opened,
        time
      )
      VALUES ${placeholders}
      ON CONFLICT(id) DO UPDATE SET
        lat = excluded.lat,
        lon = excluded.lon,
        sender = excluded.sender,
        receiver = excluded.receiver,
        opened = excluded.opened,
        time = excluded.time
    `,
    values,
  };
}

export async function UpsertCrumbs(crumbs: Crumb[]) {
  if (!crumbs.length) return;
  const db = await getDb();

  await db.withTransactionAsync(async () => {
    for (let i = 0; i < crumbs.length; i += CHUNK_SIZE) {
      const chunk = crumbs.slice(i, i + CHUNK_SIZE);
      const { sql, values } = buildUpsertCrumbsQuery(chunk);

      await db.runAsync(sql, values);
    }
  });
}