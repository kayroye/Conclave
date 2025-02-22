'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeDialog } from '@/components/onboarding/welcome-dialog';
import { User, AIProvider, Chat } from '@/lib/types';
import Cookies from 'js-cookie';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus, Lock, Globe } from "lucide-react";
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton";
import { NewChatDialog } from "@/components/chat/new-chat-dialog";
import { JoinChatDialog } from "@/components/chat/join-chat-dialog";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from 'date-fns';

const USER_ID_COOKIE = 'user_id';

interface FirebaseTimestamp {
  _seconds: number;
  _nanoseconds: number;
}

interface ChatResponse extends Omit<Chat, 'createdAt' | 'updatedAt'> {
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

export default function HomePage() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [joinChatDialogOpen, setJoinChatDialogOpen] = useState(false);
  const [skeletonCount, setSkeletonCount] = useState(3);

  const checkUser = async () => {
    try {
      const userId = Cookies.get(USER_ID_COOKIE);
      if (!userId) {
        setShowWelcome(true);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/user', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          Cookies.remove(USER_ID_COOKIE);
          setShowWelcome(true);
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to fetch user');
      }

      const { user } = await response.json() as { user: User };
      setUser(user);

      // Fetch chat data
      const chatsResponse = await fetch('/api/chats', {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!chatsResponse.ok) {
        throw new Error('Failed to fetch chats');
      }

      const { chats } = await chatsResponse.json() as { chats: ChatResponse[] };
      console.log('chats', chats);
      
      // Store the chat count in localStorage
      localStorage.setItem('chat_count', chats.length.toString());
      
      // Convert Firebase timestamps to Date objects
      const parsedChats = chats.map(chat => ({
        ...chat,
        createdAt: new Date(chat.createdAt._seconds * 1000),
        updatedAt: new Date(chat.updatedAt._seconds * 1000)
      }));
      
      setChats(parsedChats);
    } catch (error) {
      console.error('Error checking user:', error);
      setShowWelcome(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    // Try to get the stored chat count from localStorage
    const storedCount = localStorage.getItem('chat_count');
    if (storedCount) {
      setSkeletonCount(parseInt(storedCount, 10));
    }
  }, []);

  const handleNewChatDialogClose = () => {
    setNewChatDialogOpen(false);
  };

  const handleCreateChat = async (chatConfig: {
    name: string;
    isPublic: boolean;
    aiParticipants: {
      name: string;
      provider: AIProvider;
      model: string;
    }[];
  }) => {
    try {
      const userId = Cookies.get(USER_ID_COOKIE);
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify(chatConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const { chatId } = await response.json();
      router.push(`/chats/${chatId}`);
    } catch (error) {
      console.error('Error creating chat:', error);
      // You might want to show an error toast here
    }
  };

  const handleJoinChat = async (joinCode: string) => {
    try {
      const userId = Cookies.get(USER_ID_COOKIE);
      const response = await fetch('/api/chats/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '',
        },
        body: JSON.stringify({ joinCode, userId }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Invalid join code');
        }
        throw new Error('Failed to join chat');
      }

      const { id } = await response.json();
      router.push(`/chats/${id}`);
    } catch (error) {
      console.error('Error joining chat:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[180px]" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(skeletonCount).fill(0).map((_, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-1">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-[140px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-[80%]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (showWelcome) {
    return (
      <div className="min-h-screen">
        <WelcomeDialog onComplete={() => {
          setShowWelcome(false);
          checkUser();
        }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <WelcomeDialog onComplete={() => {
          setShowWelcome(false);
          checkUser();
        }} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back{user.name ? `, ${user.name}` : ''}!</h1>
          <p className="text-muted-foreground">Here are your recent chats:</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setJoinChatDialogOpen(true)}>
            Join Chat
          </Button>
          <Button onClick={() => setNewChatDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Chat
          </Button>
        </div>
      </div>

      <NewChatDialog
        isOpen={newChatDialogOpen}
        onClose={handleNewChatDialogClose}
        onCreateChat={handleCreateChat}
      />

      <JoinChatDialog
        isOpen={joinChatDialogOpen}
        onClose={() => setJoinChatDialogOpen(false)}
        onJoinChat={handleJoinChat}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chats.map((chat) => (
          <Link key={chat.id} href={`/chats/${chat.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="space-y-1">
                <div className="flex justify-between items-start">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`/avatars/01.png`} />
                    <AvatarFallback>{chat.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {chat.isPublic ? (
                        <Globe className="mr-1 h-3 w-3" />
                      ) : (
                        <Lock className="mr-1 h-3 w-3" />
                      )}
                      {chat.isPublic ? 'Public' : 'Private'}
                    </Badge>
                    {chat.messages.length > 0 && (
                      <Badge variant="secondary">
                        <MessageCircle className="mr-1 h-3 w-3" />
                        {chat.messages.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{chat.name}</CardTitle>
                <CardDescription>
                  {chat.messages.length > 0
                    ? `Last active ${formatDistanceToNow(chat.updatedAt, { addSuffix: true })}`
                    : 'No messages yet'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {chat.messages.length > 0
                      ? 'Continue your conversation...'
                      : 'Start a new conversation...'}
                  </p>
                  {chat.aiParticipants.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {chat.aiParticipants.map((ai) => (
                        <Badge key={ai.id} variant="outline">
                          {ai.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {chats.length === 0 && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No chats yet</CardTitle>
              <CardDescription>
                Start or join a new chat to begin your conversations!
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
