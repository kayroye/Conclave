import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, query, where, getDocs } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { Chat, ChatMessage, AIChatParticipant, User } from '../types';

export const createChat = async (creatorId: string, name: string): Promise<Chat> => {
  const chatId = uuidv4();
  const newChat: Chat = {
    id: chatId,
    name,
    createdAt: new Date(),
    participants: [creatorId],
    aiParticipants: [],
    messages: []
  };
  
  await setDoc(doc(db, 'chats', chatId), newChat);
  
  // Update user's chats array
  const userRef = doc(db, 'users', creatorId);
  await updateDoc(userRef, {
    chats: arrayUnion(chatId)
  });
  
  return newChat;
};

export const addParticipant = async (chatId: string, userId: string) => {
  const chatRef = doc(db, 'chats', chatId);
  const userRef = doc(db, 'users', userId);
  
  await updateDoc(chatRef, {
    participants: arrayUnion(userId)
  });
  
  await updateDoc(userRef, {
    chats: arrayUnion(chatId)
  });
};

export const addAIParticipant = async (
  chatId: string,
  aiParticipant: Omit<AIChatParticipant, 'id'>
) => {
  const chatRef = doc(db, 'chats', chatId);
  const aiId = uuidv4();
  const newAIParticipant: AIChatParticipant = {
    ...aiParticipant,
    id: aiId
  };
  
  await updateDoc(chatRef, {
    aiParticipants: arrayUnion(newAIParticipant)
  });
  
  return newAIParticipant;
};

export const sendMessage = async (
  chatId: string,
  senderId: string,
  content: string,
  isAI: boolean = false
) => {
  const chatRef = doc(db, 'chats', chatId);
  const chatDoc = await getDoc(chatRef);
  const chat = chatDoc.data() as Chat;
  
  // Get sender name
  let senderName = '';
  if (isAI) {
    const aiParticipant = chat.aiParticipants.find(ai => ai.id === senderId);
    senderName = aiParticipant?.name || 'AI';
  } else {
    const userDoc = await getDoc(doc(db, 'users', senderId));
    const user = userDoc.data() as User;
    senderName = user.name;
  }
  
  const newMessage: ChatMessage = {
    id: uuidv4(),
    content,
    createdAt: new Date(),
    senderId,
    senderName,
    isAI
  };
  
  await updateDoc(chatRef, {
    messages: arrayUnion(newMessage)
  });
  
  return newMessage;
};

export const getUserChats = async (userId: string): Promise<Chat[]> => {
  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data() as Chat);
}; 