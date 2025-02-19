import { adminDb } from '../firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Chat, ChatMessage, AIChatParticipant, User } from '../types';

export const createChat = async (
  creatorId: string,
  name: string,
  isPublic: boolean = false,
  aiParticipants: Omit<AIChatParticipant, 'id'>[] = []
): Promise<Chat> => {
  const chatId = uuidv4();
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Create AI participants with IDs
  const aiParticipantsWithIds: AIChatParticipant[] = aiParticipants.map(ai => ({
    ...ai,
    id: uuidv4()
  }));

  const now = Timestamp.now().toDate();
  const newChat: Chat = {
    id: chatId,
    joinCode,
    name,
    isPublic,
    createdAt: now,
    updatedAt: now,
    participants: [creatorId],
    aiParticipants: aiParticipantsWithIds,
    messages: []
  };
  
  await adminDb.collection('chats').doc(chatId).set(newChat);
  
  // Update user's chats array
  const userRef = adminDb.collection('users').doc(creatorId);
  await userRef.update({
    chats: FieldValue.arrayUnion(chatId)
  });
  
  return newChat;
};

export const addParticipant = async (chatId: string, userId: string) => {
  const chatRef = adminDb.collection('chats').doc(chatId);
  const userRef = adminDb.collection('users').doc(userId);
  
  await chatRef.update({
    participants: FieldValue.arrayUnion(userId)
  });
  
  await userRef.update({
    chats: FieldValue.arrayUnion(chatId)
  });
};

export const addAIParticipant = async (
  chatId: string,
  aiParticipant: Omit<AIChatParticipant, 'id'>
) => {
  const chatRef = adminDb.collection('chats').doc(chatId);
  const aiId = uuidv4();
  const newAIParticipant: AIChatParticipant = {
    ...aiParticipant,
    id: aiId
  };
  
  await chatRef.update({
    aiParticipants: FieldValue.arrayUnion(newAIParticipant)
  });
  
  return newAIParticipant;
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  content: string,
  isAI: boolean = false
) => {
  const chatRef = adminDb.collection('chats').doc(chatId);
  const chatDoc = await chatRef.get();
  const chat = chatDoc.data() as Chat;
  
  // Get sender name
  let senderName = '';
  if (isAI) {
    const aiParticipant = chat.aiParticipants.find(ai => ai.id === senderId);
    senderName = aiParticipant?.name || 'AI';
  } else {
    const userDoc = await adminDb.collection('users').doc(senderId).get();
    const user = userDoc.data() as User;
    senderName = user.name;
  }
  
  const now = Timestamp.now().toDate();
  const messageId = uuidv4();
  const newMessage: ChatMessage = {
    id: messageId,
    content,
    createdAt: now,
    updatedAt: now,
    senderId,
    senderName,
    isAI
  };
  
  // Store the message in the messages collection
  await adminDb.collection('messages').doc(messageId).set(newMessage);
  
  // Update the chat with the new message ID and timestamp
  await chatRef.update({
    messages: FieldValue.arrayUnion(messageId),
    updatedAt: now
  });
  
  return newMessage;
};

export const getUserChats = async (userId: string): Promise<Chat[]> => {
  const chatsRef = adminDb.collection('chats');
  const querySnapshot = await chatsRef
    .where('participants', 'array-contains', userId)
    .get();
  
  return querySnapshot.docs.map(doc => doc.data() as Chat);
};

export const getChat = async (chatId: string): Promise<Chat | null> => {
  const chatRef = adminDb.collection('chats').doc(chatId);
  const chatDoc = await chatRef.get();
  
  if (!chatDoc.exists) {
    return null;
  }
  
  return chatDoc.data() as Chat;
};

export const getChatMessages = async (
  chatId: string,
  limit: number = 15,
  beforeTimestamp?: Date
): Promise<{
  messages: ChatMessage[];
  hasMore: boolean;
}> => {
  const chatRef = adminDb.collection('chats').doc(chatId);
  const chatDoc = await chatRef.get();
  
  if (!chatDoc.exists) {
    throw new Error('Chat not found');
  }
  
  const chat = chatDoc.data() as Chat;
  const messageIds = chat.messages;
  
  // Get all messages from the messages collection
  const messagesSnapshot = await Promise.all(
    messageIds.map(id => adminDb.collection('messages').doc(id).get())
  );
  
  const messages = messagesSnapshot
    .filter(doc => doc.exists)
    .map(doc => {
      const data = doc.data()!;
      // Convert Firestore Timestamps to Date objects
      return {
        ...data,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as ChatMessage;
    });
  
  // Sort messages by createdAt in descending order (newest first)
  messages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  // If we have a timestamp, filter messages before that time
  let filteredMessages = messages;
  if (beforeTimestamp) {
    filteredMessages = messages.filter(msg => msg.createdAt.getTime() < beforeTimestamp.getTime());
  }
  
  // Get one more than the limit to check if there are more messages
  const paginatedMessages = filteredMessages.slice(0, limit + 1);
  const hasMore = paginatedMessages.length > limit;
  
  // Return only the requested number of messages
  return {
    messages: paginatedMessages.slice(0, limit),
    hasMore
  };
};

export const updateChat = async (
  chatId: string,
  updates: {
    name?: string;
    isPublic?: boolean;
  }
): Promise<Chat> => {
  const chatRef = adminDb.collection('chats').doc(chatId);
  const chatDoc = await chatRef.get();
  
  if (!chatDoc.exists) {
    throw new Error('Chat not found');
  }

  await chatRef.update(updates);
  
  const updatedDoc = await chatRef.get();
  return updatedDoc.data() as Chat;
};

