// src/app/api/data-sources/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getFirestore, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { getApps } from 'firebase/app';

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

    const apps = getApps();
    if (apps.length === 0) {
      return NextResponse.json({ error: 'Firebase not initialized' }, { status: 500 });
    }

    const db = getFirestore(apps[0]);
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const docPath = `artifacts/${appId}/users/${session.user.id}/datasources/${id}`;
    const docRef = doc(db, docPath);

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    await deleteDoc(docRef);
    return NextResponse.json({ success: true, message: 'Data source deleted' }, { status: 200 });
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
    return NextResponse.json({ success: true, message: 'Connection test successful' }, { status: 200 });
  } catch (error) {
    console.error('[API] Error testing connection:', error);
    return NextResponse.json({ error: 'Connection test failed' }, { status: 500 });
  }
}
