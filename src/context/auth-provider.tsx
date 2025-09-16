
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp, writeBatch, increment, Timestamp, arrayUnion, limit, where } from 'firebase/firestore';
import { LoginFormData, SignupFormData, UserProfile, ChatMessage, ChatSession, PronunciationAttempt, QuizAttempt, LeaderboardEntry, LastActivity, Class } from '@/lib/types';
import { differenceInCalendarDays, startOfWeek } from 'date-fns';
import { allBadges, Badge } from '@/lib/badges';
import { useToast } from '@/hooks/use-toast';


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
  savePronunciationAttempt: (sentence: string, attempt: PronunciationAttempt) => Promise<number>;
  saveListeningScore: (exerciseId: string, isCorrect: boolean) => Promise<number>;
  saveQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'completedAt'>) => Promise<number>;
  getQuizHistory: () => Promise<QuizAttempt[]>;
  getLeaderboard: (category: 'badgeCount' | 'streak' | 'weeklyXP') => Promise<LeaderboardEntry[]>;
  createClass: (className: string) => Promise<void>;
  getTeacherClasses: () => Promise<Class[]>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to create a Firestore-safe key from a sentence
const createSafeKey = (sentence: string) => sentence.replace(/[.#$[\]/]/g, '_');


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const checkAndAwardBadges = useCallback(async (userId: string, profile: UserProfile, quizHistory: QuizAttempt[] = []) => {
      const earnedBadges: string[] = [];
      
      const checkBadge = (badge: Badge) => {
          if (!profile.badges?.includes(badge.id)) {
              if (badge.condition(profile, quizHistory)) {
                  earnedBadges.push(badge.id);
              }
          }
      };

      allBadges.forEach(checkBadge);

      if (earnedBadges.length > 0) {
          const userDocRef = doc(db, "users", userId);
          await updateDoc(userDocRef, {
              badges: arrayUnion(...earnedBadges),
              badgeCount: increment(earnedBadges.length),
          });
          
          const newBadgeCount = (profile.badgeCount || 0) + earnedBadges.length;
          setUserProfile(prev => prev ? { ...prev, badges: [...(prev.badges || []), ...earnedBadges], badgeCount: newBadgeCount } : null);
          
          earnedBadges.forEach(badgeId => {
              const badge = allBadges.find(b => b.id === badgeId);
              if (badge) {
                  toast({
                      title: "Badge Unlocked!",
                      description: `You've earned the "${badge.name}" badge.`,
                  });
              }
          });
      }
  }, [toast]);

  const updateStreak = useCallback(async (userId: string, currentProfile: UserProfile) => {
    const today = new Date();
    const lastActivity = currentProfile.lastActivityDate?.toDate();
    let newStreak = currentProfile.streak || 0;
    
    if (lastActivity) {
      const daysDiff = differenceInCalendarDays(today, lastActivity);
      if (daysDiff === 1) {
        newStreak += 1; // Continued the streak
      } else if (daysDiff > 1) {
        newStreak = 1; // Reset the streak
      }
      // If daysDiff is 0, do nothing, they've already been active today.
    } else {
      newStreak = 1; // First activity
    }

    if (newStreak !== currentProfile.streak || !lastActivity) {
      const userDocRef = doc(db, "users", userId);
      const updatedProfile = { ...currentProfile, streak: newStreak, lastActivityDate: Timestamp.fromDate(today) };
      await updateDoc(userDocRef, {
        streak: newStreak,
        lastActivityDate: Timestamp.fromDate(today),
      });
      setUserProfile(updatedProfile);
      await checkAndAwardBadges(userId, updatedProfile);
    }
  }, [checkAndAwardBadges]);
  
  // Client-side logic to update weekly XP
  const updateWeeklyXP = async (xpGained: number) => {
      if (!auth.currentUser) return;

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const currentProfileDoc = await getDoc(userDocRef);
      if (!currentProfileDoc.exists()) return;

      const currentProfile = currentProfileDoc.data() as UserProfile;

      const today = new Date();
      const lastResetDate = currentProfile.weeklyXPResetDate?.toDate();
      const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday

      const updates: any = {};

      if (!lastResetDate || lastResetDate < startOfThisWeek) {
          updates.weeklyXP = xpGained;
          updates.weeklyXPResetDate = Timestamp.fromDate(startOfThisWeek);
      } else {
          updates.weeklyXP = increment(xpGained);
      }
      
      try {
        await updateDoc(userDocRef, updates);
        
        const updatedDoc = await getDoc(userDocRef);
        if (updatedDoc.exists()) {
            setUserProfile(updatedDoc.data() as UserProfile);
        }

      } catch (error) {
        console.error("Failed to update weekly XP:", error);
      }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data() as UserProfile;
          setUserProfile(profileData);
          await updateStreak(user.uid, profileData);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [updateStreak]);
  
  const setLastActivity = async (activity: LastActivity) => {
      if (!auth.currentUser) return;
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { lastActivity: activity });
  };


  const signUp = async (data: SignupFormData) => {
    const { name, email, password } = data;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    const newUserProfile: UserProfile = {
      name: name,
      email: email,
      age: 0,
      language: "EN",
      role: 'student',
      xp: 0,
      weeklyXP: 0,
      streak: 0,
      badges: [],
      badgeCount: 0,
      pronunciationScores: {},
      listeningScores: {},
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
    
    const activityTitle = message.original ? `Chat: "${message.original.substring(0, 30)}..."` : "Started a new chat";
    await setLastActivity({ type: 'chat', title: activityTitle });
    
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

  const savePronunciationAttempt = async (sentence: string, attempt: PronunciationAttempt): Promise<number> => {
    if (!auth.currentUser || !userProfile) {
        return 0;
    }

    await setLastActivity({ type: 'reading', title: `Reading: "${sentence.substring(0, 30)}..."` });

    const safeKey = createSafeKey(sentence);
    const currentBestAttempt = userProfile.pronunciationScores?.[safeKey];
    let xpGained = 0;

    // Award XP only for the first time achieving 100%
    if (attempt.score === 100 && currentBestAttempt?.score !== 100) {
        xpGained = 15;
    }

    // Only save the best score.
    if (attempt.score > (currentBestAttempt?.score || 0)) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const fieldPath = `pronunciationScores.${safeKey}`;
        const updates: any = { [fieldPath]: attempt };

        if (xpGained > 0) {
            updates.xp = increment(xpGained);
            await updateWeeklyXP(xpGained);
        }

        await updateDoc(userDocRef, updates);

        const updatedProfileDoc = await getDoc(userDocRef);
        const updatedProfile = updatedProfileDoc.data() as UserProfile;

        setUserProfile(updatedProfile);
        
        if (xpGained > 0) {
            await checkAndAwardBadges(auth.currentUser.uid, updatedProfile);
        }
    }
    return xpGained;
  };

  const saveListeningScore = async (exerciseId: string, isCorrect: boolean): Promise<number> => {
    if (!auth.currentUser || !userProfile) {
      return 0;
    }
    
    await setLastActivity({ type: 'listening', title: `Listening Exercise ${exerciseId}` });


    const xpEarned = userProfile.listeningScores?.[exerciseId];
    let xpGained = 0;

    if (isCorrect && !xpEarned) {
        xpGained = 10;
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const fieldPath = `listeningScores.${exerciseId}`;
        await updateDoc(userDocRef, { 
            [fieldPath]: xpGained,
            xp: increment(xpGained)
        });
        await updateWeeklyXP(xpGained);

        const updatedProfileDoc = await getDoc(userDocRef);
        const updatedProfile = updatedProfileDoc.data() as UserProfile;
        setUserProfile(updatedProfile);
        await checkAndAwardBadges(auth.currentUser.uid, updatedProfile);
    }
    return xpGained;
  };

  const saveQuizAttempt = async (attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<number> => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    await setLastActivity({ type: 'quiz', title: `Quiz on ${attempt.topic}` });
    
    const xpGained = attempt.score * 5;
    const historyRef = collection(db, "users", auth.currentUser.uid, "quizHistory");
    await addDoc(historyRef, {
      ...attempt,
      completedAt: serverTimestamp(),
    });
    
    const userDocRef = doc(db, "users", auth.currentUser.uid);

    // First, update weekly XP which relies on the current server state
    await updateWeeklyXP(xpGained);

    // Then, update the total XP
    await updateDoc(userDocRef, { xp: increment(xpGained) });

    // After all server updates, fetch the definitive state from the server
    const updatedProfileDoc = await getDoc(userDocRef);
    if (updatedProfileDoc.exists()) {
        const updatedProfile = updatedProfileDoc.data() as UserProfile;
        // Update the local state with the fresh data from the server
        setUserProfile(updatedProfile);
        
        // Run badge check with the most up-to-date profile
        const quizHistory = await getQuizHistory();
        await checkAndAwardBadges(auth.currentUser.uid, updatedProfile, quizHistory);
    }

    return xpGained;
  };

  const getQuizHistory = async (): Promise<QuizAttempt[]> => {
    if (!auth.currentUser) return [];
    const historyRef = collection(db, "users", auth.currentUser.uid, "quizHistory");
    const q = query(historyRef, orderBy("completedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt));
  };

  const getLeaderboard = async (category: 'badgeCount' | 'streak' | 'weeklyXP'): Promise<LeaderboardEntry[]> => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, orderBy(category, "desc"), limit(100));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc, index) => {
        const data = doc.data() as UserProfile;
        return {
            rank: index + 1,
            userId: doc.id,
            name: data.name,
            value: data[category] || 0,
        };
    });
  };

  const createClass = async (className: string) => {
    if (!auth.currentUser || !userProfile || userProfile.role === 'student') {
        throw new Error("You do not have permission to create classes.");
    }
    const classesRef = collection(db, "classes");
    await addDoc(classesRef, {
        className,
        teacherId: auth.currentUser.uid,
        teacherName: userProfile.name,
        studentIds: [],
        createdAt: serverTimestamp(),
    });
  };

  const getTeacherClasses = async (): Promise<Class[]> => {
    if (!auth.currentUser) return [];
    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("teacherId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
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
    saveListeningScore,
    saveQuizAttempt,
    getQuizHistory,
    getLeaderboard,
    createClass,
    getTeacherClasses,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
