import { NextResponse } from 'next/server';
import { joinChat } from '@/lib/services/chatService';

export async function POST(request: Request) {
  const { joinCode, userId } = await request.json();
  try {
    const chat = await joinChat(joinCode, userId);

    // Simply return the chat's id
    return NextResponse.json({ id: chat.id });
  } catch (error) {
    if(error instanceof Error && error.message === 'Invalid join code') {
      return NextResponse.json({ error: 'Invalid join code' }, { status: 404 });
    }
    console.error('Error joining chat:', error);
    return NextResponse.json({ error: 'Failed to join chat' }, { status: 500 });
  }
}
