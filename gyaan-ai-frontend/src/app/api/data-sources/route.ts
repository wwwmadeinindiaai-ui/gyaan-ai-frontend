// src/app/api/data-sources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Initialize Firebase Admin for server-side
const getFirebaseApp = () => {
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0];
  }
  
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  
  return initializeApp(firebaseConfig);
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const app = getFirebaseApp();
    const db = getFirestore(app);
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const datasourcesPath = `artifacts/${appId}/users/${session.user.id}/datasources`;
    const datasourcesRef = collection(db, datasourcesPath);
    const q = query(datasourcesRef);
    const snapshot = await getDocs(q);
    
    const sources: any[] = [];
    snapshot.forEach((doc) => {
      sources.push({ id: doc.id, ...doc.data() });
    });

    return NextResponse.json({ sources }, { status: 200 });
  } catch (error) {
    console.error('[API] Error fetching data sources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, service, endpoint } = body;

    if (!name || !type || !service) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const app = getFirebaseApp();
    const db = getFirestore(app);
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const datasourcesPath = `artifacts/${appId}/users/${session.user.id}/datasources`;
    const datasourcesRef = collection(db, datasourcesPath);

    const newSource = {
      name,
      type,
      status: 'active',
      config: { service, endpoint: endpoint || '' },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(datasourcesRef, newSource);

    return NextResponse.json({ id: docRef.id, ...newSource }, { status: 201 });
  } catch (error) {
    console.error('[API] Error adding data source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
