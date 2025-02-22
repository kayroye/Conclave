import { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import Cookies from 'js-cookie';

const USER_ID_COOKIE = 'user_id';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userId = Cookies.get(USER_ID_COOKIE);
        if (!userId) {
          setUser(null);
          setLoading(false);
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
            setUser(null);
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch user');
        }

        const { user } = await response.json() as { user: User };
        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  return { user, loading };
} 