// src/app/api/data-sources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apps = getApps();
    if (apps.length === 0) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    const db = getFirestore(apps[0]);
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

    const apps = getApps();
    if (apps.length === 0) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    const db = getFirestore(apps[0]);
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
