import { Friendship } from "../models/userDetails";
import { bulkUpsert } from "./InitDb";

export async function upsertFriendship(friendships: Friendship[]) {
  try {
    await bulkUpsert(friendships, [
      {
        table: "friendships",
        columns: [
          "friendId", "pictureUrl", "name", "nickname", "displayName", "createdAt", "timestamp", "status",
        ],
        conflictColumns: ["id", "friendId"],
        toRows: (friendship) => [[
          friendship.friendId,
          friendship.pictureUrl ?? "",
          friendship.name ?? "",
          friendship.nickname,
          friendship.displayName ?? "",
          friendship.createdAt,
          friendship.timestamp,
          friendship.status
        ]],
      },
    ])
  } catch (error) {
    console.error("Failed to upsert friendship reason: ", error)
  }
}