import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// Default settings
const defaultSettings = {
  darkMode: true,
  autoSaveDrafts: true,
  highAccuracyMode: false,
  emailNotifications: false,
  subscriptionTier: 'Pro'
};

// In-memory storage (replace with database in production)
const settingsStore = new Map<string, any>();

// GET - Fetch user settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get settings from store or return defaults
    const settings = settingsStore.get(userId) || defaultSettings;
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Update user settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    
    // Get current settings
    const currentSettings = settingsStore.get(userId) || defaultSettings;
    
    // Merge with new settings
    const updatedSettings = {
      ...currentSettings,
      ...body
    };
    
    // Save to store
    settingsStore.set(userId, updatedSettings);
    
    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
