import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

// TODO: Add your Firebase credentials to .env (see .env.example).
// Get these from Firebase Console → Project settings → General → Your apps.
// Required for Realtime Database: VITE_FIREBASE_DATABASE_URL and VITE_FIREBASE_PROJECT_ID.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasRequiredConfig =
  typeof import.meta.env.VITE_FIREBASE_PROJECT_ID === "string" &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID.length > 0 &&
  typeof import.meta.env.VITE_FIREBASE_DATABASE_URL === "string" &&
  import.meta.env.VITE_FIREBASE_DATABASE_URL.length > 0;

let app: FirebaseApp | null = null;
let db: Database | null = null;

function initFirebase(): { app: FirebaseApp | null; db: Database | null } {
  if (!hasRequiredConfig) {
    console.warn(
      "[Firebase] Missing credentials. Add VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_DATABASE_URL (and other VITE_FIREBASE_* vars) to .env — see .env.example"
    );
    return { app: null, db: null };
  }
  if (app != null) return { app, db };
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  return { app, db };
}

const { app: firebaseApp, db: firebaseDb } = initFirebase();
export { firebaseApp, firebaseDb };
