// server-only admin init
import { getApps, initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore as AdminFirestore } from "firebase-admin/firestore";

let _db: AdminFirestore | null = null;

export function getAdminDb(): AdminFirestore {
  if (_db) return _db;

  const projectId = process.env.FIREBASE_PROJECT_ID!;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY!;

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // Vercel keeps \n escaped; turn them into real newlines:
        privateKey: privateKey.replace(/\\n/g, "\n"),
      } as ServiceAccount),
    });

  _db = getFirestore(app);
  return _db;
}
