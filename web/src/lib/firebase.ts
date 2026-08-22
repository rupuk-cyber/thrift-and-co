import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const ENV_VAR_BY_KEY = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
} as const;

function readEnvValues(): Record<keyof FirebaseConfig, string | undefined> {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

let appInstance: FirebaseApp | null = null;

function missingEnvVarNames(): string[] {
  const values = readEnvValues();
  return Object.keys(ENV_VAR_BY_KEY)
    .filter((key) => !values[key as keyof FirebaseConfig])
    .map((key) => ENV_VAR_BY_KEY[key as keyof FirebaseConfig]);
}

function requireConfig(): FirebaseConfig {
  const values = readEnvValues();
  const missing = missingEnvVarNames();
  if (missing.length > 0) {
    throw new Error(
      `Firebase is not configured: missing environment variables ${missing.join(", ")}. ` +
        "Add them to web/.env.local using the values from Firebase console > Project settings > Your apps > SDK setup, then restart the dev server."
    );
  }
  return values as FirebaseConfig;
}

function resolveApp(): FirebaseApp {
  if (!appInstance) {
    const config = requireConfig();
    appInstance = getApps().length > 0 ? getApp() : initializeApp(config);
  }
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  return getAuth(resolveApp());
}

export function getFirestoreDb(): Firestore {
  return getFirestore(resolveApp());
}
