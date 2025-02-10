'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeDialog } from '@/components/onboarding/welcome-dialog';
import { User } from '@/lib/types';
import Cookies from 'js-cookie';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus } from "lucide-react";
import Link from 'next/link';
import { Skeleton } from "@/components/ui/skeleton";

const USER_ID_COOKIE = 'user_id';

export default function HomePage() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
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
      } catch (error) {
        console.error('Error checking user:', error);
        setShowWelcome(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleOnboardingComplete = (userId: string) => {
    console.log('User created with ID:', userId);
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
          {[1, 2, 3].map((i) => (
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

  if (!user) {
    return (
      <div className="min-h-screen">
        <WelcomeDialog isOpen={showWelcome} onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Welcome back{user.name ? `, ${user.name}` : ''}</h1>
          <p className="text-muted-foreground">Here are your recent chats</p>
        </div>
        <Link 
          href="/chats/new" 
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {user.chats.map((chatId, index) => (
          <Link key={chatId} href={`/chats/${chatId}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="space-y-1">
                <div className="flex justify-between items-start">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`/avatars/0${(index % 3) + 1}.png`} />
                    <AvatarFallback>CH</AvatarFallback>
                  </Avatar>
                  <Badge variant="secondary">
                    <MessageCircle className="mr-1 h-3 w-3" />
                    Active
                  </Badge>
                </div>
                <CardTitle className="text-lg">Chat {index + 1}</CardTitle>
                <CardDescription>Last active 2 hours ago</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Continue your conversation...
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}

        {user.chats.length === 0 && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>No chats yet :(</CardTitle>
              <CardDescription>
                Start a new chat to begin your conversations!
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
