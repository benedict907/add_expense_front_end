import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";

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

let auth: Auth | null = null;

function initFirebase(): {
  app: FirebaseApp | null;
  db: Database | null;
  auth: Auth | null;
} {
  if (!hasRequiredConfig) {
    console.warn(
      "[Firebase] Missing credentials. Add VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_DATABASE_URL (and other VITE_FIREBASE_* vars) to .env — see .env.example"
    );
    return { app: null, db: null, auth: null };
  }
  if (app != null) return { app, db, auth };
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
  return { app, db, auth };
}

const { app: firebaseApp, db: firebaseDb, auth: firebaseAuth } = initFirebase();
export { firebaseApp, firebaseDb, firebaseAuth };
