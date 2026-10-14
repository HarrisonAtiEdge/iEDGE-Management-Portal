import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { RequestActor } from "@/lib/employeeRequests";

const PANEL_ID = "IEDGE-SYSTEM";

// Active users, as in User Management: approved accounts that haven't been
// deactivated, sorted by name. Listens only while enabled.
export function useActiveUsers(enabled = true) {
  const [users, setUsers] = useState<RequestActor[]>([]);

  useEffect(() => {
    if (!enabled) return;

    return onSnapshot(
      collection(db, "Panels", PANEL_ID, "users"),
      (snapshot) => {
        setUsers(
          snapshot.docs
            .filter((userDoc) => {
              const data = userDoc.data();
              return (
                data.accountStatus === "approved" && data.isActive !== false
              );
            })
            .map((userDoc) => {
              const data = userDoc.data();
              return {
                id: userDoc.id,
                name:
                  data.displayName || data.name || data.email || "Unknown user",
                email: data.email || "",
                role: data.role || "",
              };
            })
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      },
      (error) => console.error("Failed to load users:", error),
    );
  }, [enabled]);

  return users;
}
