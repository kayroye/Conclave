import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase';
import { User } from '@/lib/types';
import { signInAnonymously } from 'firebase/auth';


export async function POST(req: NextRequest) {
  try {
    const { nickname } = await req.json();
    
    if (!nickname?.trim()) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      );
    }

    // Create anonymous user in Firebase Auth
    const user = await signInAnonymously(auth);
    const userId = user.user?.uid;
        
    // Create user document in Firestore
    const newUser: User = {
      id: userId,
      name: nickname.trim(),
      createdAt: new Date(),
      chats: [],
      preferences: {
        notifications: true,
        defaultAIProvider: 'openai'
      }
    };

    await adminDb.doc(`users/${userId}`).set(newUser);

    return NextResponse.json({ user: newUser });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userDoc = await adminDb.doc(`users/${userId}`).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: userDoc.data() });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const updates = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userRef = adminDb.doc(`users/${userId}`);
    await userRef.update(updates);
    const updatedDoc = await userRef.get();

    return NextResponse.json({ user: updatedDoc.data() });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
} 