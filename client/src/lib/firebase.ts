// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
//   authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
//   messagingSenderId: "681914308324",
//   appId: import.meta.env.VITE_FIREBASE_APP_ID
// };


// const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const storage = getStorage(app);

// export default app;






import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "681914308324",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ------------------------------
// 🔥 MAIN APP (normal authentication)
// ------------------------------
export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// ------------------------------
// 🔥 SECONDARY APP (used ONLY for creating users)
// Prevents admin from getting logged out
// ------------------------------
export const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);

export default app;


