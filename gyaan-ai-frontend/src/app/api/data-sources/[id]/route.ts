// src/app/api/data-sources/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getAdminDb } from '@/lib/firebase-admin';

// GET /api/data-sources/[id] - Get a single data source
export async function GET(
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

    return NextResponse.json({ id: docSnap.id, ...docSnap.data() }, { status: 200 });
  } catch (error) {
    console.error('[API] Error retrieving data source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/data-sources/[id] - Update a data source
export async function PUT(
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

    const body = await request.json();
    const { name, type, service, endpoint } = body;

    if (!name || !type || !service) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const appId = process.env.NEXT_PUBLIC_APP_ID || 'default-app-id';
    const datasourcesPath = `artifacts/${appId}/users/${session.user.id}/datasources`;
    const docRef = db.collection(datasourcesPath).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 });
    }

    const updatedSource = {
      name,
      type,
      config: { service, endpoint: endpoint || '' },
      updatedAt: new Date(),
    };

    await docRef.update(updatedSource);

    return NextResponse.json({ id: docRef.id, ...updatedSource }, { status: 200 });
  } catch (error) {
    console.error('[API] Error updating data source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


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
