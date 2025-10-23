import * as admin from 'firebase-admin';

let adminDb: admin.firestore.Firestore | null = null;

function initializeFirebaseAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing Firebase Admin credentials');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return admin.firestore();
}

export function getAdminDb(): admin.firestore.Firestore {
  if (!adminDb) {
    adminDb = initializeFirebaseAdmin();
  }
  return adminDb;
}
