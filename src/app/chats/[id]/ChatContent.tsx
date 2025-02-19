'use client';

import { useEffect, useState, useRef } from 'react';
import { ChatMessage, Chat } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import Cookies from 'js-cookie';
import { ChatHeader } from '@/components/chat/chat-header';

const USER_ID_COOKIE = 'user_id';

export default function ChatContent({ chatId }: { chatId: string }) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadChat = async () => {
    try {
      const userId = Cookies.get(USER_ID_COOKIE);
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/chats/${chatId}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat');
      }

      const { chat } = await response.json();
      setChat(chat);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const loadMessages = async (beforeTimestamp?: Date) => {
    try {
      const userId = Cookies.get(USER_ID_COOKIE);
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const params = new URLSearchParams();
      params.append('limit', '15');
      if (beforeTimestamp) {
        params.append('before', beforeTimestamp.toISOString());
      }

      const response = await fetch(`/api/chats/${chatId}/messages?${params}`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const result = await response.json();
      
      if (beforeTimestamp) {
        setMessages(prev => [...result.messages.reverse(), ...prev]);
      } else {
        setMessages(result.messages.reverse()); // Reverse to show oldest first
      }
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    
    setLoadingMore(true);
    try {
      await loadMessages(messages[0].createdAt);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleUpdateChat = async (updates: Partial<Chat>) => {
    try {
      const userId = Cookies.get(USER_ID_COOKIE);
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update chat');
      }

      const { chat: updatedChat } = await response.json();
      setChat(updatedChat);
    } catch (error) {
      console.error('Error updating chat:', error);
      throw error; // Re-throw to handle in the UI
    }
  };

  useEffect(() => {
    const initializeChat = async () => {
      try {
        await Promise.all([loadChat(), loadMessages()]);
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeChat();
  }, [chatId]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;

    const userId = Cookies.get(USER_ID_COOKIE);
    if (!userId) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ content: messageInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const { message } = await response.json();
      setMessages(prev => [...prev, message]);
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (!chat) {
    return <div className="flex items-center justify-center h-full">Chat not found</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <ChatHeader chat={chat} onUpdateChat={handleUpdateChat} />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={loadMoreMessages}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.isAI ? 'justify-start' : 'justify-end'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.isAI
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.senderName}
              </div>
              <div className="break-words">{message.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="border-t p-4 flex gap-2 items-center"
      >
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
