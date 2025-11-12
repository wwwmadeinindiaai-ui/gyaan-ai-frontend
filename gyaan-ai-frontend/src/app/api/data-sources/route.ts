// src/app/api/data-sources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getAdminDb();
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const datasourcesPath = `artifacts/${appId}/users/${session.user.id}/datasources`;
    
    const snapshot = await db.collection(datasourcesPath).get();
    
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

    const db = getAdminDb();
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const datasourcesPath = `artifacts/${appId}/users/${session.user.id}/datasources`;

    const newSource = {
      name,
      type,
      status: 'active',
      config: { service, endpoint: endpoint || '' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await db.collection(datasourcesPath).add(newSource);

    return NextResponse.json({ id: docRef.id, ...newSource }, { status: 201 });
  } catch (error) {
    console.error('[API] Error adding data source:', error);    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
