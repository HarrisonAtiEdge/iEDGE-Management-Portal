import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { UserStamp } from "./types";

/** Who is acting, for createdBy/updatedBy fields. */
export function useCurrentUserStamp(): UserStamp | null {
  const { currentUser, userProfile } = useAuth();

  return useMemo(() => {
    if (!currentUser) return null;
    return {
      uid: currentUser.uid,
      name:
        userProfile?.displayName ||
        currentUser.displayName ||
        currentUser.email ||
        "Unknown user",
    };
  }, [currentUser, userProfile?.displayName]);
}
