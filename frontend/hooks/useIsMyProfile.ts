import { GetId } from "@/constants/userAccountDetails";
import { useEffect, useState } from "react";

export function useIsMyProfile(userId: string) {
  const [isMine, setIsMine] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    async function check() {
      const myId = await GetId();
      if (active) setIsMine(userId === myId);
    }
    check();
    return () => { active = false };
  }, [userId]);

  return isMine;
}