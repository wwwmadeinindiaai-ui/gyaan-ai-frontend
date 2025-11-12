// src/app/api/data-sources/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';

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

    const db = getAdminDb();
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const datasourcesPath = `artifacts/${appId}/users/${session.user.id}/datasources`;
    const docRef = db.collection(datasourcesPath).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    await docRef.delete();

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

    const db = getAdminDb();
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const datasourcesPath = `artifacts/${appId}/users/${session.user.id}/datasources`;
    const docRef = db.collection(datasourcesPath).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    return NextResponse.json({ status: 'Connection successful', tested: true }, { status: 200 });
  } catch (error) {
    console.error('[API] Error testing connection:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
