import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User } from '@/lib/types';
import Cookies from 'js-cookie';

const USER_ID_COOKIE = 'user_id';

interface WelcomeDialogProps {
  isOpen: boolean;
  onComplete: (userId: string) => void;
}

export function WelcomeDialog({ isOpen, onComplete }: WelcomeDialogProps) {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create user');
      }

      const { user } = await response.json() as { user: User };
      Cookies.set(USER_ID_COOKIE, user.id, { expires: 365 }); // Store for 1 year
      onComplete(user.id);
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Welcome to Conclave!</DialogTitle>
          <DialogDescription>
            Join collaborative AI chats with ease. No sign-up required - just choose a nickname to get started.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Input
              id="nickname"
              placeholder="Enter your nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={isLoading}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !nickname.trim()}>
            {isLoading ? "Creating your profile..." : "Get Started"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 