'use client';

import { Home, Inbox, MessageSquare, Settings, ChevronDown, Sun, Moon, Monitor, Plus, UserPlus } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"

// Menu items.
const items = [
  {
    title: "Home",
    url: "/home",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "/inbox",
    icon: Inbox,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

// Add this interface near the top
interface RecentChat {
  id: string;
  name: string;
  updatedAt: Date;
}

interface ChatResponse {
  id: string;
  name: string;
  updatedAt: {
    _seconds: number;
    _nanoseconds: number;
  };
}

function UserProfile() {
  const { user } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    Cookies.remove('user_id');
    router.push('/home');
  };

  if (!user) {
    return (
      <Link href="/home">
        <Button variant="ghost" className="w-full justify-start bg-primary/10 hover:bg-primary/20">
          Log In / Sign Up
        </Button>
      </Link>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full justify-between gap-2 bg-primary/10 hover:bg-primary/20">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{user.name}</span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" side="right" align="start">
        <div className="flex items-center gap-4">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{user.name}</h4>
          </div>
        </div>
        <Separator className="my-4" />
        {mounted && (
          <div className="mb-4">
            <Tabs defaultValue={resolvedTheme} onValueChange={setTheme}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="light" className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Light
                </TabsTrigger>
                <TabsTrigger value="dark" className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Dark
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  System
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        <div className="space-y-2">
          <Link href="/settings" className="w-full">
            <Button variant="ghost" className="w-full justify-start hover:bg-primary/10">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppSidebar() {
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [skeletonCount, setSkeletonCount] = useState(3); // Default to 3

  useEffect(() => {
    // Try to get the stored chat count from localStorage
    const storedCount = localStorage.getItem('chat_count');
    if (storedCount) {
      setSkeletonCount(Math.min(parseInt(storedCount, 10), 5)); // Cap at 5 since we only show 5 recent chats
    }
  }, []);

  useEffect(() => {
    const fetchRecentChats = async () => {
      const userId = Cookies.get('user_id');
      if (!userId) {
        setIsLoadingChats(false);
        return;
      }

      try {
        const response = await fetch('/api/chats', {
          headers: {
            'x-user-id': userId,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch chats');

        const { chats } = await response.json();
        const sortedChats = chats
          .sort((a: ChatResponse, b: ChatResponse) => 
            new Date(b.updatedAt._seconds * 1000).getTime() - new Date(a.updatedAt._seconds * 1000).getTime()
          )
          .slice(0, 5)
          .map((chat: ChatResponse) => ({
            id: chat.id,
            name: chat.name,
            updatedAt: new Date(chat.updatedAt._seconds * 1000),
          }));

        setRecentChats(sortedChats);
      } catch (error) {
        console.error('Error fetching recent chats:', error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    fetchRecentChats();
  }, []);

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-2xl font-bold px-2 text-center">Conclave</h1>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => document.dispatchEvent(new Event('new-chat'))}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>New Chat</span>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => document.dispatchEvent(new Event('join-chat'))}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    <span>Join Chat</span>
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Recent Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingChats ? (
                // Use skeletonCount instead of hardcoded value
                Array(skeletonCount).fill(0).map((_, index) => (
                  <SidebarMenuItem key={`skeleton-${index}`}>
                    <div className="flex items-center gap-2 px-4 py-2">
                      <Skeleton className="h-4 w-4" /> {/* Icon skeleton */}
                      <Skeleton className="h-4 w-[120px]" /> {/* Text skeleton */}
                    </div>
                  </SidebarMenuItem>
                ))
              ) : recentChats.length > 0 ? (
                recentChats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton asChild>
                      <Link href={`/chats/${chat.id}`}>
                        <MessageSquare className="h-4 w-4" />
                        <span className="truncate">{chat.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  No recent chats
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserProfile />
      </SidebarFooter>
    </Sidebar>
  )
}
