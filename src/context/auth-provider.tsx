
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
import { LoginFormData, SignupFormData, UserProfile, ChatMessage, ChatSession, PronunciationAttempt, QuizAttempt, LeaderboardEntry, LastActivity, Class, AdminUserView, UserRole, Assignment, Feedback, GenerateFeedbackInput, Lesson } from '@/lib/types';
import { differenceInCalendarDays, startOfWeek } from 'date-fns';
import { allBadges, Badge } from '@/lib/badges';
import { useToast } from '@/hooks/use-toast';
import { seedData } from '@/lib/seed-data';


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
  savePronunciationAttempt: (sentence: string, attempt: PronunciationAttempt, awardXp?: boolean) => Promise<number>;
  saveListeningScore: (exerciseId: string, isCorrect: boolean, awardXp?: boolean) => Promise<number>;
  saveQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'completedAt'>) => Promise<number>;
  completeAssignment: (assignmentId: string) => Promise<number>;
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
  getStudentAssignments: (userProfile?: UserProfile | null) => Promise<Assignment[]>;
  getAssignmentAttempt: (assignmentId: string) => Promise<QuizAttempt | null>;
  getStudentCompletedAttempts: () => Promise<QuizAttempt[]>;
  getStudentAssignmentAttemptsForClass: (studentId: string, classId: string) => Promise<QuizAttempt[]>;
  sendFeedback: (classId: string, students: { studentId: string, studentName: string }[], title: string, content: string) => Promise<void>;
  getSentFeedback: () => Promise<Feedback[]>;
  getReceivedFeedback: () => Promise<Feedback[]>;
  markFeedbackAsRead: (feedbackId: string) => Promise<void>;
  deleteFeedback: (feedbackId: string) => Promise<void>;
  getStudentPerformanceDataForFeedback: (studentId: string) => Promise<GenerateFeedbackInput>;
  createLesson: (lessonData: Omit<Lesson, 'id' | 'createdAt' | 'teacherId'>) => Promise<void>;
  getLessons: () => Promise<Lesson[]>;
  getLessonDetails: (lessonId: string) => Promise<Lesson | null>;
  updateLesson: (lessonId: string, lessonData: Omit<Lesson, 'id' | 'createdAt' | 'teacherId'>) => Promise<void>;
  deleteLesson: (lessonId: string) => Promise<void>;
  seedInitialLessons: () => Promise<number>;
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
    
    // We will NO LONGER create the user document here. It will be created on first login after verification.

    await sendEmailVerification(userCredential.user);
    await signOut(auth); // Log out user until they are verified
    router.push('/verify-email');
  }, [router]);

  const logIn = useCallback(async (data: LoginFormData) => {
    const { email, password } = data;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const loggedInUser = userCredential.user;

    if (!loggedInUser.emailVerified && !loggedInUser.email?.endsWith('@ezilanguages.com')) {
        router.push('/verify-email');
        return;
    }
    
    // On login, check if the user document exists in Firestore.
    const userDocRef = doc(db, "users", loggedInUser.uid);
    const userDoc = await getDoc(userDocRef);

    let profile: UserProfile;

    if (!userDoc.exists()) {
        // This is the first login after verification. Create the user document now.
        const newUserProfile: UserProfile = {
            name: loggedInUser.displayName || "New User",
            email: loggedInUser.email!,
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
            completedAssignmentDetails: [],
        };
        await setDoc(userDocRef, newUserProfile);
        profile = newUserProfile;
    } else {
        profile = userDoc.data() as UserProfile;
    }
    
    // Redirect based on role
    if (profile.role === 'admin' || profile.role === 'superadmin') {
        router.push('/admin');
    } else if (profile.role === 'teacher') {
        router.push('/teacher');
    } else {
        router.push('/dashboard');
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

    const messagesSnapshot = await getDocs(query(messagesRef));
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


  const savePronunciationAttempt = useCallback(async (sentence: string, attempt: PronunciationAttempt, awardXp: boolean = true): Promise<number> => {
    if (!auth.currentUser || !userProfile) {
        return 0;
    }

    if (awardXp) {
        await setLastActivity({ type: 'reading', title: `Reading: "${sentence.substring(0, 30)}..."` });
    }

    const safeKey = createSafeKey(sentence);
    const currentBestAttempt = userProfile.pronunciationScores?.[safeKey];
    let xpGained = 0;

    // Award XP only for the first time achieving 100% in practice mode
    if (awardXp && attempt.score === 100 && currentBestAttempt?.score !== 100) {
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

  const saveListeningScore = useCallback(async (exerciseId: string, isCorrect: boolean, awardXp: boolean = true): Promise<number> => {
    if (!auth.currentUser || !userProfile) {
      return 0;
    }
    
    if (awardXp) {
        await setLastActivity({ type: 'listening', title: `Listening Exercise ${exerciseId}` });
    }

    const xpEarned = userProfile.listeningScores?.[exerciseId];
    let xpGained = 0;

    if (isCorrect && !xpEarned && awardXp) {
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
    } else if (isCorrect) { // If it's correct but not awarding XP (assignment mode)
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const fieldPath = `listeningScores.${exerciseId}`;
        // Still save a score to mark it as completed correctly
        await updateDoc(userDocRef, { [fieldPath]: 10 });
    }

    return xpGained;
  }, [userProfile, setLastActivity, updateWeeklyXP, checkAndAwardBadges]);

  const getQuizHistory = useCallback(async (): Promise<QuizAttempt[]> => {
    if (!auth.currentUser) return [];
    const historyRef = collection(db, "users", auth.currentUser.uid, "quizHistory");
    const q = query(historyRef, orderBy("completedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt));
  }, []);

  const saveQuizAttempt = useCallback(async (attempt: Omit<QuizAttempt, 'id' | 'completedAt'>): Promise<number> => {
    if (!auth.currentUser) throw new Error("User not authenticated");

    const isAssignment = !!attempt.assignmentId;
    const activityTitle = isAssignment ? `Assignment: ${attempt.topic}` : `Quiz on ${attempt.topic}`;
    await setLastActivity({ type: 'quiz', title: activityTitle });

    const xpGained = attempt.score * 5;

    // Determine the correct collection and data payload
    const collectionName = isAssignment ? "assignmentAttempts" : "quizHistory";
    const ref = collection(db, "users", auth.currentUser.uid, collectionName);
    
    const completedAtTimestamp = serverTimestamp();

    const dataToSave: any = {
        ...attempt,
        completedAt: completedAtTimestamp,
    };

    // Explicitly remove assignmentId for self-generated quizzes to avoid Firestore errors.
    if (!isAssignment) {
        delete dataToSave.assignmentId;
    }

    await addDoc(ref, dataToSave);

    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const updates: any = { xp: increment(xpGained) };

    if (isAssignment) {
        updates.completedAssignments = arrayUnion(attempt.assignmentId);
        updates.completedAssignmentDetails = arrayUnion({
            assignmentId: attempt.assignmentId,
            completedAt: Timestamp.now()
        });
    }

    await updateWeeklyXP(xpGained);
    await updateDoc(userDocRef, updates);

    const updatedProfileDoc = await getDoc(userDocRef);
    if (updatedProfileDoc.exists()) {
        const updatedProfile = updatedProfileDoc.data() as UserProfile;
        setUserProfile(updatedProfile);

        // Fetch only self-generated quiz history for badge calculation.
        const selfGeneratedQuizHistory = await getQuizHistory();
        await checkAndAwardBadges(auth.currentUser.uid, updatedProfile, selfGeneratedQuizHistory);
    }

    return xpGained;
  }, [setLastActivity, updateWeeklyXP, getQuizHistory, checkAndAwardBadges]);
  
  const completeAssignment = useCallback(async (assignmentId: string): Promise<number> => {
    if (!auth.currentUser) throw new Error("User not authenticated");

    // Award a flat 50 XP for completing a non-quiz assignment
    const xpGained = 50;

    const userDocRef = doc(db, "users", auth.currentUser.uid);
    const updates: any = { 
        xp: increment(xpGained),
        completedAssignments: arrayUnion(assignmentId),
        completedAssignmentDetails: arrayUnion({
            assignmentId: assignmentId,
            completedAt: Timestamp.now()
        })
    };

    await updateWeeklyXP(xpGained);
    await updateDoc(userDocRef, updates);

    const updatedProfileDoc = await getDoc(userDocRef);
     if (updatedProfileDoc.exists()) {
        const updatedProfile = updatedProfileDoc.data() as UserProfile;
        setUserProfile(updatedProfile);
        const selfGeneratedQuizHistory = await getQuizHistory();
        await checkAndAwardBadges(auth.currentUser.uid, updatedProfile, selfGeneratedQuizHistory);
    }
    
    return xpGained;
  }, [updateWeeklyXP, getQuizHistory, checkAndAwardBadges]);


  const getLeaderboard = useCallback(async (category: 'badgeCount' | 'streak' | 'weeklyXP'): Promise<LeaderboardEntry[]> => {
    const usersRef = collection(db, "users");
    const q = query(
        usersRef, 
        where("role", "==", "student"),
        orderBy(category, "desc"), 
        limit(100)
    );
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
      const totalAssignments = assignmentsSnapshot.size;

      if (classDetails.studentIds.length === 0) {
        return { students: [], totalAssignments };
      }
      
      const studentPromises = classDetails.studentIds.map(id => getDoc(doc(db, "users", id)));
      const studentDocs = await Promise.all(studentPromises);
      
      const students = studentDocs
        .filter(doc => doc.exists())
        .map(doc => {
            const studentData = doc.data() as UserProfile;
            const completedAssignmentDetails = studentData.completedAssignmentDetails || [];
            return { 
                uid: doc.id, 
                ...studentData,
                assignmentsCompletedCount: completedAssignmentDetails.length,
                completedAssignmentDetails: completedAssignmentDetails,
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
      // Allow teacher to get all users for stats, but they can't manage them.
      // throw new Error("You do not have permission to view users.");
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

  const getStudentCompletedAttempts = useCallback(async (): Promise<QuizAttempt[]> => {
    if (!auth.currentUser) return [];
    const attemptsRef = collection(db, "users", auth.currentUser.uid, "assignmentAttempts");
    const q = query(attemptsRef, orderBy("completedAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt));
  }, []);
  
  const getStudentAssignmentAttemptsForClass = useCallback(async (studentId: string, classId: string): Promise<QuizAttempt[]> => {
    if (!auth.currentUser) throw new Error("Not authenticated");

    const classDetails = await getClassDetails(classId);
    if (!classDetails) return [];
    
    const assignmentsRef = collection(db, "assignments");
    const qAssignments = query(assignmentsRef, where("assignedClasses", "array-contains", { classId: classDetails.id, className: classDetails.className }));
    const assignmentsSnapshot = await getDocs(qAssignments);
    const classAssignmentIds = assignmentsSnapshot.docs.map(doc => doc.id);

    if (classAssignmentIds.length === 0) return [];
    
    const attemptsRef = collection(db, "users", studentId, "assignmentAttempts");
    const qAttempts = query(attemptsRef, where("assignmentId", "in", classAssignmentIds), orderBy("completedAt", "desc"));
    const attemptsSnapshot = await getDocs(qAttempts);

    return attemptsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt));
  }, [getClassDetails]);

  const sendFeedback = useCallback(async (classId: string, students: { studentId: string, studentName: string }[], title: string, content: string) => {
    if (!auth.currentUser || !userProfile) throw new Error("Not authenticated");
    
    const batch = writeBatch(db);
    const feedbackRef = collection(db, "feedback");

    students.forEach(student => {
        const newFeedbackRef = doc(feedbackRef);
        batch.set(newFeedbackRef, {
            teacherId: auth.currentUser.uid,
            teacherName: userProfile.name,
            studentId: student.studentId,
            studentName: student.studentName,
            classId,
            title,
            content,
            createdAt: serverTimestamp(),
            isRead: false,
        });
    });

    await batch.commit();
    await setLastActivity({ type: 'feedback', title: `Sent feedback: "${title}"` });
  }, [userProfile, setLastActivity]);

  const getSentFeedback = useCallback(async (): Promise<Feedback[]> => {
    if (!auth.currentUser) return [];
    const feedbackRef = collection(db, "feedback");
    const q = query(feedbackRef, where("teacherId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
  }, []);
  
  const getReceivedFeedback = useCallback(async (): Promise<Feedback[]> => {
    if (!auth.currentUser) return [];
    const feedbackRef = collection(db, "feedback");
    const q = query(feedbackRef, where("studentId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Feedback));
  }, []);

  const markFeedbackAsRead = useCallback(async (feedbackId: string) => {
    if (!auth.currentUser) throw new Error("Not authenticated");
    const feedbackRef = doc(db, "feedback", feedbackId);
    await updateDoc(feedbackRef, { isRead: true });
  }, []);

  const deleteFeedback = useCallback(async (feedbackId: string) => {
    if (!auth.currentUser) throw new Error("Not authenticated");
    const feedbackRef = doc(db, "feedback", feedbackId);
    const docSnap = await getDoc(feedbackRef);
    if (docSnap.exists() && docSnap.data().teacherId === auth.currentUser.uid) {
        await deleteDoc(feedbackRef);
    } else {
        throw new Error("You do not have permission to delete this feedback.");
    }
  }, []);

  const getStudentPerformanceDataForFeedback = useCallback(async (studentId: string): Promise<GenerateFeedbackInput> => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      const userDocRef = doc(db, "users", studentId);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
          throw new Error("Student not found");
      }

      const userProfile = userDoc.data() as UserProfile;

      const quizHistoryRef = collection(db, "users", studentId, "quizHistory");
      const quizHistoryQuery = query(quizHistoryRef, orderBy("completedAt", "desc"));
      const quizHistorySnapshot = await getDocs(quizHistoryQuery);
      const quizHistory = quizHistorySnapshot.docs.map(doc => doc.data() as QuizAttempt);
      
      const assignmentHistoryRef = collection(db, "users", studentId, "assignmentAttempts");
      const assignmentHistoryQuery = query(assignmentHistoryRef, orderBy("completedAt", "desc"));
      const assignmentHistorySnapshot = await getDocs(assignmentHistoryQuery);
      const assignmentHistory = assignmentHistorySnapshot.docs.map(doc => doc.data() as QuizAttempt);

      return {
          studentName: userProfile.name,
          performanceData: {
              pronunciationScores: userProfile.pronunciationScores,
              listeningScores: userProfile.listeningScores,
              quizHistory: quizHistory,
              assignmentHistory: assignmentHistory,
          }
      };
  }, []);
  
  const createLesson = useCallback(async (lessonData: Omit<Lesson, 'id' | 'createdAt' | 'teacherId'>) => {
    if (!auth.currentUser || !userProfile || !['admin', 'superadmin'].includes(userProfile.role)) {
      throw new Error("You do not have permission to create lessons.");
    }
    const lessonsRef = collection(db, "lessons");
    await addDoc(lessonsRef, {
      ...lessonData,
      teacherId: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });
  }, [userProfile]);

  const getLessons = useCallback(async (): Promise<Lesson[]> => {
    const lessonsRef = collection(db, "lessons");
    const q = query(lessonsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
  }, []);
  
  const getLessonDetails = useCallback(async (lessonId: string): Promise<Lesson | null> => {
      if (!auth.currentUser) throw new Error("Not authenticated");
      const lessonRef = doc(db, "lessons", lessonId);
      const docSnap = await getDoc(lessonRef);
      if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Lesson;
      }
      return null;
  }, []);

  const updateLesson = useCallback(async (lessonId: string, lessonData: Omit<Lesson, 'id' | 'createdAt' | 'teacherId'>) => {
    if (!auth.currentUser || !userProfile || !['admin', 'superadmin'].includes(userProfile.role)) {
        throw new Error("You do not have permission to update lessons.");
    }
    const lessonRef = doc(db, "lessons", lessonId);
    await updateDoc(lessonRef, lessonData);
  }, [userProfile]);


  const deleteLesson = useCallback(async (lessonId: string) => {
      if (!auth.currentUser || !userProfile || !['admin', 'superadmin'].includes(userProfile.role)) {
          throw new Error("You do not have permission to delete lessons.");
      }
      const lessonRef = doc(db, "lessons", lessonId);
      await deleteDoc(lessonRef);
  }, [userProfile]);
  
  const seedInitialLessons = useCallback(async (): Promise<number> => {
    if (!auth.currentUser || !userProfile || !['admin', 'superadmin'].includes(userProfile.role)) {
      throw new Error("You do not have permission to seed data.");
    }
    
    const lessonsRef = collection(db, "lessons");
    const snapshot = await getDocs(query(lessonsRef, limit(1)));
    if (!snapshot.empty) {
      return 0; // Data already exists
    }

    const batch = writeBatch(db);
    seedData.forEach(lesson => {
      const docRef = doc(lessonsRef); // Auto-generate ID
      batch.set(docRef, {
        ...lesson,
        teacherId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
    });
    await batch.commit();
    return seedData.length;
  }, [userProfile]);


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
    completeAssignment,
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
    getStudentCompletedAttempts,
    getStudentAssignmentAttemptsForClass,
    sendFeedback,
    getSentFeedback,
    getReceivedFeedback,
    markFeedbackAsRead,
    deleteFeedback,
    getStudentPerformanceDataForFeedback,
    createLesson,
    getLessons,
    getLessonDetails,
    updateLesson,
    deleteLesson,
    seedInitialLessons,
  }), [
      user, userProfile, loading, signUp, logIn, logOut, updateUserProfile, updateUserAppData, sendPasswordReset,
      getChatList, getChatMessages, saveChatMessage, deleteChatSession, savePronunciationAttempt,
      saveListeningScore, saveQuizAttempt, completeAssignment, getQuizHistory, getLeaderboard, createClass, getTeacherClasses,
      deleteClass, getAllUsers, updateUserRole, getClassDetails, getStudentsForClassManagement, getStudentsForClass,
      addStudentToClass, removeStudentFromClass, searchStudentsByEmail, createAssignment, updateAssignment,
      getTeacherAssignments, getAssignmentDetails, deleteAssignment, assignAssignmentToClasses, getStudentAssignments,
      getAssignmentAttempt, getStudentCompletedAttempts, getStudentAssignmentAttemptsForClass, sendFeedback,
      getSentFeedback, getReceivedFeedback, markFeedbackAsRead, deleteFeedback, getStudentPerformanceDataForFeedback,
      createLesson, getLessons, getLessonDetails, updateLesson, deleteLesson, seedInitialLessons,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
