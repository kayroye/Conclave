'use client';

import { Chat } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

interface ChatHeaderProps {
  chat: Chat;
  onUpdateChat?: (updates: Partial<Chat>) => Promise<void>;
}

export function ChatHeader({ chat, onUpdateChat }: ChatHeaderProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chatName, setChatName] = useState(chat.name);
  const [isPublic, setIsPublic] = useState(chat.isPublic);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSaveSettings = async () => {
    if (!onUpdateChat) return;
    
    setIsUpdating(true);
    try {
      await onUpdateChat({
        name: chatName,
        isPublic,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating chat:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="border-b p-4 flex justify-between items-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div>
        <h1 className="text-xl font-semibold">{chat.name}</h1>
        <p className="text-sm text-muted-foreground">
          {chat.participants.length} participant{chat.participants.length !== 1 ? 's' : ''} •{' '}
          {chat.isPublic ? 'Public' : 'Private'} • Join Code: {chat.joinCode}
        </p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chat Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="chatName">Chat Name</Label>
              <Input
                id="chatName"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="public">Public Chat</Label>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={isUpdating || (!onUpdateChat)}
                className="w-full"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 