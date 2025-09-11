"use client";

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { LoginFormData, SignupFormData } from '@/lib/types';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: SignupFormData) => Promise<void>;
  logIn: (data: LoginFormData) => Promise<void>;
  logInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (data: SignupFormData) => {
    const { name, email, password } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    setUser(userCredential.user);
    router.push('/dashboard');
  };

  const logIn = async (data: LoginFormData) => {
    const { email, password } = data;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setUser(userCredential.user);
    router.push('/dashboard');
  };
  
  const logInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    setUser(userCredential.user);
    router.push('/dashboard');
  };

  const logOut = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };
  
  const updateUserProfile = async (displayName: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      // Create a new user object to trigger re-render
      setUser({ ...auth.currentUser });
    }
  };


  const value: AuthContextType = {
    user,
    loading,
    signUp,
    logIn,
    logInWithGoogle,
    logOut,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
