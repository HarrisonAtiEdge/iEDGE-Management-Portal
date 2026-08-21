// import React, { createContext, useContext, useEffect, useState } from "react";
// import {
//   User as FirebaseUser,
//   onAuthStateChanged,
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut,
//   updateProfile,
// } from "firebase/auth";
// import {
//   doc,
//   getDoc,
//   setDoc,
//   serverTimestamp,
//   updateDoc,
// } from "firebase/firestore";
// import { auth, db } from "@/lib/firebase";
// import { User, UserRole, AccountStatus } from "@shared/schema";
// import { useLocation } from "wouter";

// interface AuthContextType {
//   currentUser: FirebaseUser | null;
//   userProfile: User | null;
//   loading: boolean;
//   login: (email: string, password: string) => Promise<void>;
//   register: (
//     email: string,
//     password: string,
//     displayName: string,
//     role: UserRole
//   ) => Promise<void>;
//   logout: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | null>(null);

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error("useAuth must be used within an AuthProvider");
//   return context;
// }

// const PANEL_ID = "IEDGE-SYSTEM";
// const userDocRef = (uid: string) => doc(db, "Panels", PANEL_ID, "users", uid);
// const legacyUserDocRef = (uid: string) => doc(db, "users", uid);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
//   const [userProfile, setUserProfile] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   const [, setLocation] = useLocation();

//   async function register(
//     email: string,
//     password: string,
//     displayName: string,
//     role: UserRole
//   ) {
//     const userCredential = await createUserWithEmailAndPassword(
//       auth,
//       email,
//       password
//     );
//     await updateProfile(userCredential.user, { displayName });

//     // Auto-approve main admin accounts to bootstrap the system
//     let accountStatus: AccountStatus = "pending";
//     if (role === "main_admin") accountStatus = "approved";

//     const userDoc: Omit<User, "id"> = {
//       email,
//       displayName,
//       role,
//       accountStatus,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };

//     // ✅ SAVE IN PANEL PATH
//     await setDoc(userDocRef(userCredential.user.uid), {
//       ...userDoc,
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp(),
//     });

//     // (Optional) If you still have old code in other places reading /users,
//     // you can also write to legacy for compatibility. Otherwise remove this.
//     // await setDoc(legacyUserDocRef(userCredential.user.uid), {
//     //   ...userDoc,
//     //   createdAt: serverTimestamp(),
//     //   updatedAt: serverTimestamp(),
//     // });
//   }

//   async function login(email: string, password: string) {
//     await signInWithEmailAndPassword(auth, email, password);
//   }

//   async function logout() {
//     await signOut(auth);
//     setUserProfile(null);
//     setLocation("/login");
//   }

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       setCurrentUser(user);

//       try {
//         if (!user) {
//           setUserProfile(null);
//           setLoading(false);
//           setLocation("/login");
//           return;
//         }

//         // ✅ Read from PANEL PATH first
//         let snap = await getDoc(userDocRef(user.uid));

//         // Optional fallback: support legacy /users/{uid}
//         if (!snap.exists()) {
//           const legacySnap = await getDoc(legacyUserDocRef(user.uid));
//           if (legacySnap.exists()) {
//             // (Optional) migrate legacy -> panel once
//             const legacyData = legacySnap.data();
//             await setDoc(
//               userDocRef(user.uid),
//               {
//                 ...legacyData,
//                 migratedAt: serverTimestamp(),
//                 updatedAt: serverTimestamp(),
//               },
//               { merge: true }
//             );
//             snap = await getDoc(userDocRef(user.uid));
//           }
//         }

//         if (!snap.exists()) {
//           // This is exactly your “Login failed user record not found”
//           setUserProfile(null);
//           setLoading(false);
//           // You may choose to sign out or route to an error page
//           await signOut(auth);
//           setLocation("/login");
//           return;
//         }

//         const userData: any = snap.data();

//         // Auto-approve main admin accounts on login
//         let accountStatus = userData.accountStatus;
//         if (userData.role === "main_admin" && userData.accountStatus === "pending") {
//           accountStatus = "approved";
//           await updateDoc(userDocRef(user.uid), {
//             accountStatus: "approved",
//             updatedAt: serverTimestamp(),
//           });
//         }

//         setUserProfile({
//           id: user.uid,
//           email: userData.email,
//           displayName: userData.displayName,
//           role: userData.role,
//           accountStatus,
//           createdAt: userData.createdAt?.toDate ? userData.createdAt.toDate() : new Date(),
//           updatedAt: userData.updatedAt?.toDate ? userData.updatedAt.toDate() : new Date(),
//         });

//         // ✅ role-based redirect
//         if (userData.role === "sales") {
//           setLocation("/sales-dashboard");
//         } else {
//           setLocation("/dashboard");
//         }

//         setLoading(false);
//       } catch (err) {
//         console.error("Auth bootstrap failed:", err);
//         setUserProfile(null);
//         setLoading(false);
//         setLocation("/login");
//       }
//     });

//     return unsubscribe;
//   }, [setLocation]);

//   const value: AuthContextType = {
//     currentUser,
//     userProfile,
//     loading,
//     login,
//     register,
//     logout,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {!loading && children}
//     </AuthContext.Provider>
//   );
// }

// // import React, { createContext, useContext, useEffect, useState } from "react";
// // import {
// //   User as FirebaseUser,
// //   onAuthStateChanged,
// //   signInWithEmailAndPassword,
// //   createUserWithEmailAndPassword,
// //   signOut,
// //   updateProfile,
// // } from "firebase/auth";
// // import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
// // import { auth, db } from "@/lib/firebase";
// // import { User, UserRole, AccountStatus } from "@shared/schema";
// // import { useLocation } from "wouter";

// // interface AuthContextType {
// //   user: FirebaseUser | null;
// //   userProfile: User | null;
// //   loading: boolean;
// //   login: (email: string, password: string) => Promise<void>;
// //   register: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
// //   logout: () => Promise<void>;
// // }

// // const AuthContext = createContext<AuthContextType | null>(null);

// // export function useAuth() {
// //   const context = useContext(AuthContext);
// //   if (!context) throw new Error("useAuth must be used within an AuthProvider");
// //   return context;
// // }

// // export function AuthProvider({ children }: { children: React.ReactNode }) {
// //   const [user, setUser] = useState<FirebaseUser | null>(null);
// //   const [userProfile, setUserProfile] = useState<User | null>(null);
// //   const [loading, setLoading] = useState(true);
// //   const [, setLocation] = useLocation();

// //   // ---------------- REGISTER ----------------
// //   async function register(email: string, password: string, displayName: string, role: UserRole) {
// //     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
// //     await updateProfile(userCredential.user, { displayName });

// //     let accountStatus: AccountStatus = role === "main_admin" ? "approved" : "pending";

// //     await setDoc(doc(db, "users", userCredential.user.uid), {
// //       email,
// //       displayName,
// //       role,
// //       accountStatus,
// //       createdAt: serverTimestamp(),
// //       updatedAt: serverTimestamp(),
// //     });
// //   }

// //   // ---------------- LOGIN ----------------
// //   async function login(email: string, password: string) {
// //     const cred = await signInWithEmailAndPassword(auth, email, password);
// //     const snap = await getDoc(doc(db, "users", cred.user.uid));
// //     if (!snap.exists()) throw new Error("User profile not found");

// //     const data = snap.data() as any;

// //     if (data.accountStatus !== "approved") throw new Error("Account not approved yet");

// //     setUserProfile({
// //       id: cred.user.uid,
// //       email: data.email,
// //       displayName: data.displayName,
// //       role: data.role,
// //       accountStatus: data.accountStatus,
// //       createdAt: data.createdAt?.toDate() || new Date(),
// //       updatedAt: data.updatedAt?.toDate() || new Date(),
// //     });

// //     setUser(cred.user);

// //     // Redirect
// //     if (data.role === "sales") setLocation("/sales-dashboard");
// //     else setLocation("/dashboard");
// //   }

// //   // ---------------- LOGOUT ----------------
// //   async function logout() {
// //     await signOut(auth);
// //     setUser(null);
// //     setUserProfile(null);
// //     setLocation("/login");
// //   }

// //   // ---------------- AUTH LISTENER ----------------
// //   useEffect(() => {
// //     const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
// //       setLoading(true);
// //       if (firebaseUser) {
// //         try {
// //           const snap = await getDoc(doc(db, "users", firebaseUser.uid));
// //           if (snap.exists()) {
// //             const data = snap.data() as any;

// //             // Auto-approve main_admin if still pending
// //             if (data.role === "main_admin" && data.accountStatus === "pending") {
// //               data.accountStatus = "approved";
// //               await updateDoc(doc(db, "users", firebaseUser.uid), {
// //                 accountStatus: "approved",
// //                 updatedAt: serverTimestamp(),
// //               });
// //             }

// //             setUser(firebaseUser);
// //             setUserProfile({
// //               id: firebaseUser.uid,
// //               email: data.email,
// //               displayName: data.displayName,
// //               role: data.role,
// //               accountStatus: data.accountStatus,
// //               createdAt: data.createdAt?.toDate() || new Date(),
// //               updatedAt: data.updatedAt?.toDate() || new Date(),
// //             });
// //           } else {
// //             setUserProfile(null);
// //           }
// //         } catch (err) {
// //           console.error("Auth listener error:", err);
// //           setUserProfile(null);
// //         }
// //       } else {
// //         setUser(null);
// //         setUserProfile(null);
// //       }
// //       setLoading(false);
// //     });

// //     return unsubscribe;
// //   }, []);

// //   return (
// //     <AuthContext.Provider value={{ user, userProfile, loading, login, register, logout }}>
// //       {!loading && children}
// //     </AuthContext.Provider>
// //   );
// // }

import React, { createContext, useContext, useEffect, useState } from "react";

import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { User, UserRole, AccountStatus } from "@shared/schema";

import { useLocation } from "wouter";

// ======================================================
// TYPES
// ======================================================

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;

  register: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ) => Promise<void>;

  logout: () => Promise<void>;
}

// ======================================================
// CONTEXT
// ======================================================

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

// ======================================================
// FIRESTORE PATH
// ======================================================

const PANEL_ID = "IEDGE-SYSTEM";

const userDocRef = (uid: string) => doc(db, "Panels", PANEL_ID, "users", uid);

const legacyUserDocRef = (uid: string) => doc(db, "users", uid);

// ======================================================
// PROVIDER
// ======================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const [userProfile, setUserProfile] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);

  const [, setLocation] = useLocation();

  // ======================================================
  // REGISTER
  // ======================================================

  async function register(
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
  ) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    await updateProfile(userCredential.user, {
      displayName,
    });

    let accountStatus: AccountStatus = "pending";

    if (role === "main_admin") {
      accountStatus = "approved";
    }

    const userDoc: Omit<User, "id"> = {
      email,
      displayName,
      role,
      accountStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(userDocRef(userCredential.user.uid), {
      ...userDoc,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // ======================================================
  // LOGIN
  // ======================================================

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // ======================================================
  // LOGOUT
  // ======================================================

  async function logout() {
    await signOut(auth);

    setUserProfile(null);

    setLocation("/login");
  }

  // ======================================================
  // NORMAL FIREBASE AUTH LISTENER
  // ======================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      try {
        if (!user) {
          setUserProfile(null);
          setLoading(false);
          setLocation("/login");
          return;
        }

        // ------------------------------------------
        // Read panel user profile
        // ------------------------------------------

        let snap = await getDoc(userDocRef(user.uid));

        // ------------------------------------------
        // Legacy fallback
        // ------------------------------------------

        if (!snap.exists()) {
          const legacySnap = await getDoc(legacyUserDocRef(user.uid));

          if (legacySnap.exists()) {
            const legacyData = legacySnap.data();

            await setDoc(
              userDocRef(user.uid),
              {
                ...legacyData,

                migratedAt: serverTimestamp(),

                updatedAt: serverTimestamp(),
              },
              {
                merge: true,
              },
            );

            snap = await getDoc(userDocRef(user.uid));
          }
        }

        // ------------------------------------------
        // No Firestore user
        // ------------------------------------------

        if (!snap.exists()) {
          setUserProfile(null);

          setLoading(false);

          await signOut(auth);

          setLocation("/login");

          return;
        }

        const userData: any = snap.data();

        // ------------------------------------------
        // Main admin auto approval
        // ------------------------------------------

        let accountStatus = userData.accountStatus;

        if (
          userData.role === "main_admin" &&
          userData.accountStatus === "pending"
        ) {
          accountStatus = "approved";

          await updateDoc(userDocRef(user.uid), {
            accountStatus: "approved",

            updatedAt: serverTimestamp(),
          });
        }

        // ------------------------------------------
        // Set profile
        // ------------------------------------------

        setUserProfile({
          id: user.uid,

          email: userData.email,

          displayName: userData.displayName,

          role: userData.role,

          accountStatus,

          createdAt: userData.createdAt?.toDate
            ? userData.createdAt.toDate()
            : new Date(),

          updatedAt: userData.updatedAt?.toDate
            ? userData.updatedAt.toDate()
            : new Date(),
        });

        // ------------------------------------------
        // Role redirect
        // ------------------------------------------

        if (userData.role === "sales") {
          setLocation("/sales-dashboard");
        } else {
          setLocation("/dashboard");
        }

        setLoading(false);
      } catch (err) {
        console.error("Auth bootstrap failed:", err);

        setUserProfile(null);

        setLoading(false);

        setLocation("/login");
      }
    });

    return unsubscribe;
  }, [setLocation]);

  // ======================================================
  // FORCE LOGOUT LISTENER
  // ======================================================
  //
  // This remains permanently in the application.
  //
  // The admin script writes:
  //
  // forceLogoutBefore: Timestamp
  //
  // into:
  //
  // Panels/IEDGE-SYSTEM/users/{uid}
  //
  // Every live browser sees that Firestore update.
  //
  // If the user's authentication happened BEFORE that
  // timestamp, the browser signs out automatically.
  //
  // ======================================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let signingOut = false;

    const ref = userDocRef(currentUser.uid);

    // ----------------------------------------------------
    // Process force logout value
    // ----------------------------------------------------

    const checkLogoutData = async (data: any) => {
      if (!data || signingOut) {
        return;
      }

      const forceLogoutBefore = data.forceLogoutBefore;

      if (!forceLogoutBefore) {
        return;
      }

      try {
        // Get the authentication time
        // of this currently logged-in session.

        const tokenResult = await currentUser.getIdTokenResult();

        const authTimeSeconds = Number(tokenResult.claims.auth_time || 0);

        // Firestore Timestamp
        const logoutSeconds = Number(forceLogoutBefore.seconds || 0);

        if (!authTimeSeconds || !logoutSeconds) {
          return;
        }

        // ----------------------------------------------
        // User logged in BEFORE force logout happened
        // ----------------------------------------------

        if (authTimeSeconds < logoutSeconds) {
          signingOut = true;

          console.log("Session invalidated by administrator.");

          await signOut(auth);

          setUserProfile(null);

          setLocation("/login");
        }
      } catch (error) {
        console.error("Force logout check failed:", error);
      }
    };

    // ====================================================
    // REAL-TIME FIRESTORE LISTENER
    // ====================================================

    const unsubscribe = onSnapshot(
      ref,

      async (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        await checkLogoutData(snapshot.data());
      },

      (error) => {
        console.error("Force logout listener error:", error);
      },
    );

    // ====================================================
    // BACKUP CHECK EVERY 60 SECONDS
    // ====================================================
    //
    // Normally onSnapshot logs the user out immediately.
    // This is simply an additional safety check.
    //
    // ====================================================

    const checkServer = async () => {
      if (signingOut) {
        return;
      }

      try {
        const snapshot = await getDocFromServer(ref);

        if (snapshot.exists()) {
          await checkLogoutData(snapshot.data());
        }
      } catch (error) {
        // Could simply be offline.
        console.warn("Force logout server check unavailable:", error);
      }
    };

    const interval = window.setInterval(checkServer, 60 * 1000);

    // ====================================================
    // CHECK AGAIN WHEN USER RETURNS TO TAB
    // ====================================================

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkServer();
      }
    };

    const handleFocus = () => {
      checkServer();
    };

    document.addEventListener("visibilitychange", handleVisibility);

    window.addEventListener("focus", handleFocus);

    // ====================================================
    // CLEANUP
    // ====================================================

    return () => {
      unsubscribe();

      window.clearInterval(interval);

      document.removeEventListener("visibilitychange", handleVisibility);

      window.removeEventListener("focus", handleFocus);
    };
  }, [currentUser, setLocation]);

  // ======================================================
  // CONTEXT
  // ======================================================

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
