
"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db, storage } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { LoginFormData, SignupFormData, UserProfile, ChatMessage, ChatSession, PronunciationAttempt } from '@/lib/types';

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (data: SignupFormData) => Promise<void>;
  logIn: (data: LoginFormData) => Promise<void>;
  logOut: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
  updateUserAppData: (data: Partial<UserProfile>) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  getChatList: () => Promise<ChatSession[]>;
  getChatMessages: (chatId: string) => Promise<ChatMessage[]>;
  saveChatMessage: (chatId: string | null, message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<{ chatId: string }>;
  deleteChatSession: (chatId: string) => Promise<void>;
  savePronunciationAttempt: (sentence: string, attempt: PronunciationAttempt) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to create a Firestore-safe key from a sentence
const createSafeKey = (sentence: string) => sentence.replace(/[.#$[\]/]/g, '_');


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (data: SignupFormData) => {
    const { name, email, password } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    const newUserProfile: UserProfile = {
      name: name,
      email: email,
      age: 0,
      language: "EN",
      xp: 0,
      streak: 0,
      badges: [],
      pronunciationScores: {},
    };

    await setDoc(doc(db, "users", userCredential.user.uid), newUserProfile);

    await sendEmailVerification(userCredential.user);
    await signOut(auth); // Log out user until they are verified
    router.push('/verify-email');
  };

  const logIn = async (data: LoginFormData) => {
    const { email, password } = data;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setUser(userCredential.user);
    if (userCredential.user.emailVerified) {
        router.push('/dashboard');
    } else {
        router.push('/verify-email');
    }
  };

  const logOut = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    router.push('/login');
  };
  
  const updateUserProfile = async (displayName: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { name: displayName });
      setUser({ ...auth.currentUser });
      setUserProfile((prev) => prev ? { ...prev, name: displayName } : null);
    }
  };

  const updateUserAppData = async (data: Partial<UserProfile>) => {
    if (auth.currentUser) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, data);
      setUserProfile((prev) => prev ? { ...prev, ...data } : null);
    }
  };


  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const getChatList = async (): Promise<ChatSession[]> => {
    if (!auth.currentUser) return [];
    const chatsRef = collection(db, "users", auth.currentUser.uid, "chats");
    const q = query(chatsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
  };

  const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
    if (!auth.currentUser) return [];
    const messagesRef = collection(db, "users", auth.currentUser.uid, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
  };

  const saveChatMessage = async (chatId: string | null, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<{ chatId: string }> => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    let currentChatId = chatId;
    
    if (!currentChatId) {
      const chatRef = await addDoc(collection(db, "users", auth.currentUser.uid, "chats"), {
        title: message.original?.substring(0, 40) || "New Chat",
        createdAt: serverTimestamp(),
      });
      currentChatId = chatRef.id;
    }

    const messagesRef = collection(db, "users", auth.currentUser.uid, "chats", currentChatId, "messages");
    await addDoc(messagesRef, {
      ...message,
      timestamp: serverTimestamp(),
    });

    return { chatId: currentChatId };
  };
  
  const deleteChatSession = async (chatId: string): Promise<void> => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const chatRef = doc(db, "users", auth.currentUser.uid, "chats", chatId);
    const messagesRef = collection(chatRef, "messages");

    const batch = writeBatch(db);

    const messagesSnapshot = await getDocs(messagesRef);
    messagesSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    batch.delete(chatRef);

    await batch.commit();
  };

  const savePronunciationAttempt = async (sentence: string, attempt: PronunciationAttempt): Promise<void> => {
    if (!auth.currentUser || !userProfile) {
      return Promise.resolve();
    }
  
    const safeKey = createSafeKey(sentence);
    const currentBestAttempt = userProfile.pronunciationScores?.[safeKey];
    
    // Only update if the new score is better
    if (attempt.score > (currentBestAttempt?.score || 0)) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        
        const fieldPath = `pronunciationScores.${safeKey}`;
        await updateDoc(userDocRef, { [fieldPath]: attempt });
        
        // Update local state for immediate feedback
        setUserProfile(prev => {
            if (!prev) return null;
            const newScores = { ...(prev.pronunciationScores || {}), [safeKey]: attempt };
            return { ...prev, pronunciationScores: newScores };
        });
    }
    return Promise.resolve();
  };


  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signUp,
    logIn,
    logOut,
    updateUserProfile,
    updateUserAppData,
    sendPasswordReset,
    getChatList,
    getChatMessages,
    saveChatMessage,
    deleteChatSession,
    savePronunciationAttempt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
