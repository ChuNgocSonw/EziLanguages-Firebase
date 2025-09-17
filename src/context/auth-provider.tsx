
"use client";

import React, { createContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
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
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, serverTimestamp, writeBatch, increment, Timestamp, arrayUnion, limit, where, arrayRemove, deleteField, deleteDoc } from 'firebase/firestore';
import { LoginFormData, SignupFormData, UserProfile, ChatMessage, ChatSession, PronunciationAttempt, QuizAttempt, LeaderboardEntry, LastActivity, Class, AdminUserView, UserRole, Assignment } from '@/lib/types';
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
  deleteClass: (classId: string) => Promise<void>;
  getAllUsers: () => Promise<AdminUserView[]>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  getClassDetails: (classId: string) => Promise<Class | null>;
  getStudentsForClassManagement: (classId: string) => Promise<AdminUserView[]>;
  getStudentsForClass: (classId: string) => Promise<{ students: AdminUserView[], totalAssignments: number }>;
  addStudentToClass: (classId: string, studentId: string) => Promise<void>;
  removeStudentFromClass: (classId: string, studentId: string) => Promise<void>;
  searchStudentsByEmail: (emailQuery: string) => Promise<AdminUserView[]>;
  createAssignment: (assignmentData: Omit<Assignment, 'id' | 'teacherId' | 'createdAt'>) => Promise<void>;
  updateAssignment: (assignmentId: string, assignmentData: Omit<Assignment, 'id' | 'teacherId' | 'createdAt' | 'assignedClasses'>) => Promise<void>;
  getTeacherAssignments: () => Promise<Assignment[]>;
  getAssignmentDetails: (assignmentId: string) => Promise<Assignment | null>;
  deleteAssignment: (assignmentId: string) => Promise<void>;
  assignAssignmentToClasses: (assignmentId: string, assignedClasses: Assignment['assignedClasses']) => Promise<void>;
  getStudentAssignments: () => Promise<Assignment[]>;
  getAssignmentAttempt: (assignmentId: string) => Promise<QuizAttempt | null>;
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
  
  const setLastActivity = useCallback(async (activity: LastActivity) => {
      if (!auth.currentUser) return;
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { lastActivity: activity });
  }, []);


  const signUp = useCallback(async (data: SignupFormData) => {
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
      completedAssignments: [],
    };

    await setDoc(doc(db, "users", userCredential.user.uid), newUserProfile);

    await sendEmailVerification(userCredential.user);
    await signOut(auth); // Log out user until they are verified
    router.push('/verify-email');
  }, [router]);

  const logIn = useCallback(async (data: LoginFormData) => {
    const { email, password } = data;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    setUser(userCredential.user);
    if (userCredential.user.emailVerified) {
        router.push('/dashboard');
    } else {
        router.push('/verify-email');
    }
  }, [router]);

  const logOut = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    router.push('/');
  }, [router]);
  
  const updateUserProfile = useCallback(async (displayName: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, { name: displayName });
      setUser({ ...auth.currentUser });
      setUserProfile((prev) => prev ? { ...prev, name: displayName } : null);
    }
  }, []);

  const updateUserAppData = useCallback(async (data: Partial<UserProfile>) => {
    if (auth.currentUser) {
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, data);
      setUserProfile((prev) => prev ? { ...prev, ...data } : null);
    }
  }, []);


  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const getChatList = useCallback(async (): Promise<ChatSession[]> => {
    if (!auth.currentUser) return [];
    const chatsRef = collection(db, "users", auth.currentUser.uid, "chats");
    const q = query(chatsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
  }, []);

  const getChatMessages = useCallback(async (chatId: string): Promise<ChatMessage[]> => {
    if (!auth.currentUser) return [];
    const messagesRef = collection(db, "users", auth.currentUser.uid, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
  }, []);

  const saveChatMessage = useCallback(async (chatId: string | null, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<{ chatId: string }> => {
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
  }, [setLastActivity]);
  
  const deleteChatSession = useCallback(async (chatId: string): Promise<void> => {
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
  }, []);

  const updateWeeklyXP = useCallback(async (xpGained: number) => {
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
  }, []);


  const savePronunciationAttempt = useCallback(async (sentence: string, attempt: PronunciationAttempt): Promise<number> => {
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
  }, [userProfile, setLastActivity, updateWeeklyXP, checkAndAwardBadges]);

  const saveListeningScore = useCallback(async (exerciseId: string, isCorrect: boolean): Promise<number> => {
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
  }, [userProfile, setLastActivity, updateWeeklyXP, checkAndAwardBadges]);

  const getQuizHistory = useCallback(async (): Promise<QuizAttempt[]> => {
    if (!auth.currentUser) return [];

    const historyRef = collection(db, "users", auth.currentUser.uid, "quizHistory");
    const historyQuery = query(historyRef, where("assignmentId", "==", null));
    const historySnapshot = await getDocs(historyQuery);
    const selfGenerated = historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt));

    const assignmentAttemptsRef = collection(db, "users", auth.currentUser.uid, "assignmentAttempts");
    const assignmentAttemptsSnapshot = await getDocs(assignmentAttemptsRef);
    const assignments = assignmentAttemptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt));

    const allAttempts = [...selfGenerated, ...assignments];
    allAttempts.sort((a, b) => b.completedAt.toMillis() - a.completedAt.toMillis());

    return allAttempts;
  }, []);

  const saveQuizAttempt = useCallback(async (attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<number> => {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    await setLastActivity({ type: 'quiz', title: `Quiz on ${attempt.topic}` });
    
    const xpGained = attempt.score * 5;
    
    if (attempt.assignmentId) {
        const assignmentAttemptsRef = collection(db, "users", auth.currentUser.uid, "assignmentAttempts");
        await addDoc(assignmentAttemptsRef, {
            ...attempt,
            completedAt: serverTimestamp(),
        });
    } else {
        const historyRef = collection(db, "users", auth.currentUser.uid, "quizHistory");
        await addDoc(historyRef, {
            ...attempt,
            completedAt: serverTimestamp(),
        });
    }
    
    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const updates: any = { xp: increment(xpGained) };

    if (attempt.assignmentId) {
        updates.completedAssignments = arrayUnion(attempt.assignmentId);
    }

    await updateWeeklyXP(xpGained);
    await updateDoc(userDocRef, updates);

    const updatedProfileDoc = await getDoc(userDocRef);
    if (updatedProfileDoc.exists()) {
        const updatedProfile = updatedProfileDoc.data() as UserProfile;
        setUserProfile(updatedProfile);
        
        const allQuizHistory = await getQuizHistory();
        await checkAndAwardBadges(auth.currentUser.uid, updatedProfile, allQuizHistory);
    }

    return xpGained;
  }, [setLastActivity, updateWeeklyXP, getQuizHistory, checkAndAwardBadges]);

  const getLeaderboard = useCallback(async (category: 'badgeCount' | 'streak' | 'weeklyXP'): Promise<LeaderboardEntry[]> => {
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
  }, []);

  const createClass = useCallback(async (className: string) => {
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
  }, [userProfile]);

  const getTeacherClasses = useCallback(async (): Promise<Class[]> => {
    if (!auth.currentUser) return [];
    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("teacherId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
  }, []);
  
  const deleteClass = useCallback(async (classId: string) => {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const classRef = doc(db, "classes", classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists() || classDoc.data().teacherId !== auth.currentUser.uid) {
        throw new Error("Class not found or you do not have permission to delete it.");
    }

    const studentIds = classDoc.data().studentIds || [];
    const batch = writeBatch(db);

    batch.delete(classRef);

    studentIds.forEach((studentId: string) => {
        const studentRef = doc(db, "users", studentId);
        batch.update(studentRef, { classId: deleteField() });
    });

    await batch.commit();
  }, []);
  
  const getClassDetails = useCallback(async (classId: string): Promise<Class | null> => {
    if (!auth.currentUser) return null;
    const classRef = doc(db, "classes", classId);
    const docSnap = await getDoc(classRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Class;
    }
    return null;
  }, []);

  const getStudentsForClass = useCallback(async (classId: string): Promise<{ students: AdminUserView[], totalAssignments: number }> => {
      const classDetails = await getClassDetails(classId);
      if (!classDetails) return { students: [], totalAssignments: 0 };
      
      const assignmentsRef = collection(db, "assignments");
      const qAssignments = query(assignmentsRef, where("assignedClasses", "array-contains", { classId: classDetails.id, className: classDetails.className }));
      const assignmentsSnapshot = await getDocs(qAssignments);
      const classAssignments = assignmentsSnapshot.docs.map(doc => doc.id);
      const totalAssignments = classAssignments.length;

      if (classDetails.studentIds.length === 0) {
        return { students: [], totalAssignments };
      }
      
      const studentPromises = classDetails.studentIds.map(id => getDoc(doc(db, "users", id)));
      const studentDocs = await Promise.all(studentPromises);
      
      const students = studentDocs
        .filter(doc => doc.exists())
        .map(doc => {
            const studentData = doc.data() as UserProfile;
            const completedCount = (studentData.completedAssignments || []).filter(id => classAssignments.includes(id)).length;
            return { 
                uid: doc.id, 
                ...studentData,
                assignmentsCompletedCount: completedCount,
                totalAssignmentsCount: totalAssignments
            } as AdminUserView
        });

      return { students, totalAssignments };
  }, [getClassDetails]);
  
  const getStudentsForClassManagement = useCallback(async (classId: string): Promise<AdminUserView[]> => {
      const classDetails = await getClassDetails(classId);
      if (!classDetails || classDetails.studentIds.length === 0) return [];
      
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("__name__", "in", classDetails.studentIds));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AdminUserView));
  }, [getClassDetails]);

  const searchStudentsByEmail = useCallback(async (emailQuery: string): Promise<AdminUserView[]> => {
    const usersRef = collection(db, "users");
    const endStr = emailQuery + '\uf8ff';
    const q = query(
      usersRef, 
      where("email", ">=", emailQuery),
      where("email", "<", endStr),
      where("role", "==", "student"),
      limit(5)
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AdminUserView));

    return results.filter(student => !student.classId);
  }, []);
  
  const addStudentToClass = useCallback(async (classId: string, studentId: string) => {
      const studentDoc = await getDoc(doc(db, "users", studentId));
      if (studentDoc.exists() && studentDoc.data().classId) {
          throw new Error("This student is already assigned to another class.");
      }
      
      const classRef = doc(db, "classes", classId);
      const studentRef = doc(db, "users", studentId);

      const batch = writeBatch(db);
      batch.update(classRef, { studentIds: arrayUnion(studentId) });
      batch.update(studentRef, { classId: classId });
      await batch.commit();
  }, []);
  
  const removeStudentFromClass = useCallback(async (classId: string, studentId: string) => {
      const classRef = doc(db, "classes", classId);
      const studentRef = doc(db, "users", studentId);

      const batch = writeBatch(db);
      batch.update(classRef, { studentIds: arrayRemove(studentId) });
      batch.update(studentRef, { classId: deleteField() });
      await batch.commit();
  }, []);

  const getAllUsers = useCallback(async (): Promise<AdminUserView[]> => {
    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'superadmin')) {
      throw new Error("You do not have permission to view users.");
    }
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as AdminUserView));
  }, [userProfile]);

  const updateUserRole = useCallback(async (userId: string, role: UserRole) => {
    if (!userProfile || !['admin', 'superadmin'].includes(userProfile.role)) {
      throw new Error("You do not have permission to update roles.");
    }

    if (auth.currentUser?.uid === userId) {
      throw new Error("You cannot change your own role.");
    }

    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, { role: role });
  }, [userProfile]);

  const createAssignment = useCallback(async (assignmentData: Omit<Assignment, 'id' | 'teacherId' | 'createdAt'>) => {
    if (!auth.currentUser || !userProfile || userProfile.role === 'student') {
      throw new Error("You do not have permission to create assignments.");
    }
    const assignmentsRef = collection(db, "assignments");
    await addDoc(assignmentsRef, {
      ...assignmentData,
      teacherId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });
  }, [userProfile]);

  const updateAssignment = useCallback(async (assignmentId: string, assignmentData: Omit<Assignment, 'id' | 'teacherId' | 'createdAt' | 'assignedClasses'>) => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      const assignmentRef = doc(db, "assignments", assignmentId);
      const docSnap = await getDoc(assignmentRef);
      if (!docSnap.exists() || docSnap.data().teacherId !== auth.currentUser.uid) {
        throw new Error("Permission denied or assignment not found.");
      }
      await updateDoc(assignmentRef, assignmentData);
  }, []);

  const getTeacherAssignments = useCallback(async (): Promise<Assignment[]> => {
    if (!auth.currentUser) return [];
    const assignmentsRef = collection(db, "assignments");
    const q = query(assignmentsRef, where("teacherId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
  }, []);
  
  const getAssignmentDetails = useCallback(async (assignmentId: string): Promise<Assignment | null> => {
    if (!auth.currentUser) throw new Error("Not authenticated");
    const assignmentRef = doc(db, "assignments", assignmentId);
    const docSnap = await getDoc(assignmentRef);
    if (docSnap.exists() && docSnap.data().teacherId === auth.currentUser.uid) {
        return { id: docSnap.id, ...docSnap.data() } as Assignment;
    }
    return null;
  }, []);

  const deleteAssignment = useCallback(async (assignmentId: string) => {
      if (!auth.currentUser) throw new Error("User not authenticated");
      const assignmentRef = doc(db, "assignments", assignmentId);
      const assignmentDoc = await getDoc(assignmentRef);
      if (!assignmentDoc.exists() || assignmentDoc.data().teacherId !== auth.currentUser.uid) {
        throw new Error("Assignment not found or you do not have permission to delete it.");
      }

      const batch = writeBatch(db);
      batch.delete(assignmentRef);

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("completedAssignments", "array-contains", assignmentId));
      const usersSnapshot = await getDocs(q);

      usersSnapshot.forEach(userDoc => {
        const assignmentAttemptsRef = collection(userDoc.ref, "assignmentAttempts");
        const attemptQuery = query(assignmentAttemptsRef, where("assignmentId", "==", assignmentId));
        getDocs(attemptQuery).then(attemptSnapshot => {
          attemptSnapshot.forEach(attemptDoc => {
            batch.delete(attemptDoc.ref);
          });
        });
      });
      
      await batch.commit();
  }, []);

  const assignAssignmentToClasses = useCallback(async (assignmentId: string, assignedClasses: Assignment['assignedClasses']) => {
    if (!auth.currentUser) throw new Error("Not authenticated");
    const assignmentRef = doc(db, "assignments", assignmentId);
    const docSnap = await getDoc(assignmentRef);
    if (!docSnap.exists() || docSnap.data().teacherId !== auth.currentUser.uid) {
      throw new Error("Permission denied or assignment not found.");
    }
    await updateDoc(assignmentRef, { assignedClasses: assignedClasses || [] });
  }, []);

  const getStudentAssignments = useCallback(async (userProfileParam?: UserProfile | null): Promise<Assignment[]> => {
    const profile = userProfileParam || userProfile;
    if (!profile || !profile.classId) {
        return [];
    }
    
    const assignmentsRef = collection(db, "assignments");
    const q = query(assignmentsRef, where("assignedClasses", "array-contains", { classId: profile.classId, className: "" }));
    
    const querySnapshot = await getDocs(query(assignmentsRef));

    const allAssignments = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Assignment))
      .filter(assignment => assignment.assignedClasses?.some(c => c.classId === profile.classId));
    
    allAssignments.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
            return b.createdAt.toMillis() - a.createdAt.toMillis();
        }
        return 0;
    });
    
    return allAssignments;
  }, [userProfile]);

  const getAssignmentAttempt = useCallback(async (assignmentId: string): Promise<QuizAttempt | null> => {
    if (!auth.currentUser) return null;
    const attemptsRef = collection(db, "users", auth.currentUser.uid, "assignmentAttempts");
    const q = query(attemptsRef, where("assignmentId", "==", assignmentId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as QuizAttempt;
    }
    return null;
  }, []);


  const value: AuthContextType = useMemo(() => ({
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
    deleteClass,
    getAllUsers,
    updateUserRole,
    getClassDetails,
    getStudentsForClassManagement,
    getStudentsForClass,
    addStudentToClass,
    removeStudentFromClass,
    searchStudentsByEmail,
    createAssignment,
    updateAssignment,
    getTeacherAssignments,
    getAssignmentDetails,
    deleteAssignment,
    assignAssignmentToClasses,
    getStudentAssignments,
    getAssignmentAttempt,
  }), [
      user, userProfile, loading, signUp, logIn, logOut, updateUserProfile, updateUserAppData, sendPasswordReset,
      getChatList, getChatMessages, saveChatMessage, deleteChatSession, savePronunciationAttempt,
      saveListeningScore, saveQuizAttempt, getQuizHistory, getLeaderboard, createClass, getTeacherClasses,
      deleteClass, getAllUsers, updateUserRole, getClassDetails, getStudentsForClassManagement, getStudentsForClass,
      addStudentToClass, removeStudentFromClass, searchStudentsByEmail, createAssignment, updateAssignment,
      getTeacherAssignments, getAssignmentDetails, deleteAssignment, assignAssignmentToClasses, getStudentAssignments,
      getAssignmentAttempt
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
