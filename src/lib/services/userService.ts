import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { User } from "../types";

export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<User["preferences"]>
) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { preferences: preferences });
};

export const updateUserApiKeys = async (
  userId: string,
  apiKeys: Partial<User["apiKeys"]>
) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { apiKeys: apiKeys });
};

export const updateUserName = async (userId: string, name: string) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { name });
};
