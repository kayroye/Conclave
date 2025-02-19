import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function WelcomeDialog() {
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 409) {
          // User already exists, try again
          console.log('Retrying user creation...');
          return handleSubmit(e);
        }
        throw new Error(data.error || 'Failed to create user');
      }

      const { user } = await response.json();
      
      // Set the user ID cookie
      Cookies.set('user_id', user.id, { expires: 7 });
      
      // Redirect to home page
      router.push('/home');
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm">
      <div className="container flex items-center justify-center h-full max-w-lg">
        <div className="bg-card p-6 rounded-lg shadow-lg w-full space-y-4">
          <h2 className="text-2xl font-bold text-center">Welcome to Conclave</h2>
          <p className="text-muted-foreground text-center">
            Choose a nickname to get started
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Your nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !nickname.trim()}
            >
              {isLoading ? 'Creating...' : 'Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 