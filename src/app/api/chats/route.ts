import { NextResponse } from 'next/server';
import { createChat, getUserChats } from '@/lib/services/chatService';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chats = await getUserChats(userId);
    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, isPublic, aiParticipants } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: 'Chat name is required' }, { status: 400 });
    }

    const chat = await createChat(userId, name, isPublic, aiParticipants);

    return NextResponse.json({ chatId: chat.id });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
} 