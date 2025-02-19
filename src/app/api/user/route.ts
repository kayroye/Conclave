import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { auth } from '@/lib/firebase';
import { User } from '@/lib/types';
import { signInAnonymously, signOut } from 'firebase/auth';


export async function POST(req: NextRequest) {
  try {
    const { nickname } = await req.json();
    
    if (!nickname?.trim()) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      );
    }

    // Sign out any existing anonymous user first
    if (auth.currentUser) {
      await signOut(auth);
    }

    // Create new anonymous user in Firebase Auth
    const userCredential = await signInAnonymously(auth);
    const userId = userCredential.user.uid;
        
    // Check if user already exists in Firestore
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    if (userDoc.exists) {
      console.log('User already exists, creating new anonymous user');
      await signOut(auth);
      return NextResponse.json(
        { error: 'Please try again' },
        { status: 409 }
      );
    }

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
    console.log('Created new user:', userId, 'with name:', nickname.trim());

    return NextResponse.json({ user: newUser });

  } catch (error) {
    console.error('Error creating user:', error);
    // Try to clean up if there was an error
    if (auth.currentUser) {
      await signOut(auth);
    }
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