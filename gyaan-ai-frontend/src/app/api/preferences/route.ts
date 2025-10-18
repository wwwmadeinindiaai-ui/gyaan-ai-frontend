import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// GET handler - Fetch user preferences
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const preferencesRef = doc(db, 'preferences', userEmail);
    const preferencesSnap = await getDoc(preferencesRef);

    if (preferencesSnap.exists()) {
      return NextResponse.json(preferencesSnap.data());
    } else {
      // Return default preferences if none exist
      const defaultPreferences = {
        topics: [],
        sources: [],
        resultFormat: 'detailed',
        customApiConnections: []
      };
      return NextResponse.json(defaultPreferences);
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// POST handler - Save/Update user preferences
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userEmail = session.user.email;
    const body = await req.json();
    
    const { topics, sources, resultFormat, customApiConnections } = body;

    // Validate the data
    if (!Array.isArray(topics) || !Array.isArray(sources) || !Array.isArray(customApiConnections)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    const preferencesData = {
      topics,
      sources,
      resultFormat,
      customApiConnections,
      updatedAt: new Date().toISOString()
    };

    const preferencesRef = doc(db, 'preferences', userEmail);
    await setDoc(preferencesRef, preferencesData, { merge: true });

    return NextResponse.json(
      { success: true, message: 'Preferences saved successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json(
      { error: 'Failed to save preferences' },
      { status: 500 }
    );
  }
}
