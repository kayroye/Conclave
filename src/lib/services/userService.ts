import { db, auth } from '../firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Cookies from 'js-cookie';

const USER_ID_COOKIE = 'user_id';

export const initializeUser = async (): Promise<User> => {
  // Try to get existing user ID from cookie
  let userId = Cookies.get(USER_ID_COOKIE);
  
  // If no user ID exists, create a new one
  if (!userId) {
    // Sign in anonymously with Firebase Auth
    await signInAnonymously(auth);
    
    userId = uuidv4();
    Cookies.set(USER_ID_COOKIE, userId, { expires: 365 }); // Store for 1 year
    
    // Create new user document
    const newUser: User = {
      id: userId,
      name: `User-${userId.slice(0, 4)}`,
      createdAt: new Date(),
      chats: [],
      preferences: {
        theme: 'light',
        notifications: true
      }
    };
    
    await setDoc(doc(db, 'users', userId), newUser);
    return newUser;
  }
  
  // Get existing user data
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    // If cookie exists but no user document, create new user
    return initializeUser();
  }
  
  return userDoc.data() as User;
};

export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<User['preferences']>
) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { preferences: preferences });
};

export const updateUserApiKeys = async (
  userId: string,
  apiKeys: Partial<User['apiKeys']>
) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { apiKeys: apiKeys });
};

export const updateUserName = async (userId: string, name: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { name });
}; 