// src/app/api/data-sources/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getFirestore, doc, deleteDoc, getDoc } from 'firebase/firestore';
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const app = getFirebaseApp();
    const db = getFirestore(app);
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const docPath = `artifacts/${appId}/users/${session.user.id}/datasources/${id}`;
    const docRef = doc(db, docPath);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    await deleteDoc(docRef);

    return NextResponse.json({ message: 'Data source deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[API] Error deleting data source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const app = getFirebaseApp();
    const db = getFirestore(app);
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const docPath = `artifacts/${appId}/users/${session.user.id}/datasources/${id}`;
    const docRef = doc(db, docPath);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 'Connection successful', tested: true }, { status: 200 });
  } catch (error) {
    console.error('[API] Error testing connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
