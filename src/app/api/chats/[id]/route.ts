import { NextResponse } from 'next/server';
import { getChat, updateChat } from '@/lib/services/chatService';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chat = await getChat(params.id);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is a participant
    if (!chat.participants.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chat = await getChat(params.id);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is a participant
    if (!chat.participants.includes(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updates = await request.json();
    const allowedUpdates = {
      name: updates.name,
      isPublic: updates.isPublic,
    };

    const updatedChat = await updateChat(params.id, allowedUpdates);
    return NextResponse.json({ chat: updatedChat });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    );
  }
} 