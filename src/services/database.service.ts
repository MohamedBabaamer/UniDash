import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase.config';
import type { Course, StudentPayment, UserProfile, Resource, Exam, Series } from '../types';

// ==================== USER PROFILES ====================

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as UserProfile : null;
};

export const createUserProfile = async (userId: string, profile: Omit<UserProfile, 'id'>): Promise<void> => {
  await setDoc(doc(db, 'users', userId), {
    ...profile,
    role: profile.role || 'student', // Default to student role
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
};

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
  const docRef = doc(db, 'users', userId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
};

export const deleteUserProfile = async (userId: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', userId));
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
};

// ==================== COURSES ====================

export const getAllCourses = async (): Promise<Course[]> => {
  console.log('🔍 getAllCourses: Fetching all courses...');
  try {
    const querySnapshot = await getDocs(collection(db, 'courses'));
    console.log('✅ getAllCourses: Found', querySnapshot.docs.length, 'courses');
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
  } catch (error: any) {
    console.error('❌ getAllCourses error:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    throw error;
  }
};

export const getCoursesByUserId = async (userId: string): Promise<Course[]> => {
  const q = query(collection(db, 'courses'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};

export const getCoursesByLevel = async (level: string): Promise<Course[]> => {
  const q = query(collection(db, 'courses'), where('level', '==', level));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
};

export const getCourseById = async (id: string): Promise<Course | null> => {
  console.log('🔍 getCourseById called with ID:', id);
  const docRef = doc(db, 'courses', id);
  console.log('📄 Document reference path:', docRef.path);
  const docSnap = await getDoc(docRef);
  console.log('📦 Document exists:', docSnap.exists());
  if (docSnap.exists()) {
    console.log('📚 Document data:', docSnap.data());
  }
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Course : null;
};

export const createCourse = async (course: Omit<Course, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'courses'), course);
  return docRef.id;
};

export const updateCourse = async (id: string, updates: Partial<Course>): Promise<void> => {
  const docRef = doc(db, 'courses', id);
  await updateDoc(docRef, updates);
};

export const deleteCourse = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'courses', id));
};

// ==================== RESOURCES ====================

export const getResourcesByCourseId = async (courseId: string): Promise<Resource[]> => {
  const q = query(
    collection(db, 'resources'), 
    where('courseId', '==', courseId)
  );
  const querySnapshot = await getDocs(q);
  const resources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
  // Sort by chapter number
  return resources.sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));
};

export const createResource = async (resource: Omit<Resource, 'id'>): Promise<string> => {
  // Ensure chapterNumber is assigned persistently if missing (null or undefined)
  let toCreate = { ...resource } as any;
  if (toCreate.chapterNumber == null) {
    const counterRef = doc(db, 'counters', resource.courseId);
    await runTransaction(db, async (tx) => {
      const counterSnap = await tx.get(counterRef as any);
      if (!counterSnap.exists()) {
        // Initialize so the first assigned chapterNumber is 1, nextChapter becomes 2
        tx.set(counterRef as any, { nextChapter: 2, nextTD: 1, nextTP: 1 });
        toCreate.chapterNumber = 1;
      } else {
        const data = counterSnap.data() as any;
        const next = data.nextChapter ?? 1;
        toCreate.chapterNumber = next;
        tx.update(counterRef as any, { nextChapter: next + 1 });
      }
    });
  }

  const docRef = await addDoc(collection(db, 'resources'), toCreate);
  return docRef.id;
};

export const updateResource = async (id: string, updates: Partial<Resource>): Promise<void> => {
  const docRef = doc(db, 'resources', id);
  await updateDoc(docRef, updates);
};

export const deleteResource = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'resources', id));
};

// ==================== EXAMS ====================

export const getExamsByCourseId = async (courseId: string): Promise<Exam[]> => {
  const q = query(
    collection(db, 'exams'), 
    where('courseId', '==', courseId)
  );
  const querySnapshot = await getDocs(q);
  const exams = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
  // Sort by date in JavaScript instead of Firestore
  return exams.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const createExam = async (exam: Omit<Exam, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'exams'), exam);
  return docRef.id;
};

export const updateExam = async (id: string, updates: Partial<Exam>): Promise<void> => {
  const docRef = doc(db, 'exams', id);
  await updateDoc(docRef, updates);
};

export const deleteExam = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'exams', id));
};

// ==================== SERIES (TD/TP/Exam) ====================

export const getSeriesByCourseId = async (courseId: string): Promise<Series[]> => {
  const q = query(
    collection(db, 'series'), 
    where('courseId', '==', courseId)
  );
  const querySnapshot = await getDocs(q);
  const seriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Series));
  // Sort by date in JavaScript instead of Firestore
  return seriesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getAllSeries = async (): Promise<Series[]> => {
  const querySnapshot = await getDocs(collection(db, 'series'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Series));
};

export const createSeries = async (series: Omit<Series, 'id'>): Promise<string> => {
  // Assign a persistent sequence number per course and type (TD/TP) when missing
  let toCreate = { ...series } as any;
  if (toCreate.sequenceNumber == null && (series.type === 'TD' || series.type === 'TP')) {
    const counterRef = doc(db, 'counters', series.courseId);
    await runTransaction(db, async (tx) => {
      const counterSnap = await tx.get(counterRef as any);
      if (!counterSnap.exists()) {
        // Initialize nextTD so the first TD gets sequenceNumber 1 and nextTD becomes 2
        tx.set(counterRef as any, { nextChapter: 1, nextTD: 2, nextTP: 1 });
        toCreate.sequenceNumber = 1;
      } else {
        const data = counterSnap.data() as any;
        if (series.type === 'TD') {
          const next = data.nextTD ?? 1;
          toCreate.sequenceNumber = next;
          tx.update(counterRef as any, { nextTD: next + 1 });
        } else if (series.type === 'TP') {
          const next = data.nextTP ?? 1;
          toCreate.sequenceNumber = next;
          tx.update(counterRef as any, { nextTP: next + 1 });
        }
      }
    });
  }

  const docRef = await addDoc(collection(db, 'series'), toCreate);
  return docRef.id;
};

// NOTE: For production systems, consider moving sequence/counter increments to a trusted
// server-side function (Cloud Function) instead of relying on client-run Firestore transactions.
// This prevents abuse and centralizes business logic. See `/functions/README.md` for a scaffold.

// Get next course code number for a given prefix (e.g., 'CS')
export const getNextCourseCode = async (prefix: string): Promise<string> => {
  const codesRef = doc(db, 'counters', 'courseCodes');
  let nextCode = '';
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(codesRef as any);
    if (!snap.exists()) {
      // Start course codes at 100 (e.g., CS100). If you want a different start, update the counters doc.
      const initial = {} as any;
      initial[prefix] = 100;
      tx.set(codesRef as any, initial);
      nextCode = `${prefix}${initial[prefix]}`;
    } else {
      const data = snap.data() as any;
      const current = data[prefix] ?? 100; // default start at 100 if not present
      nextCode = `${prefix}${current + 1}`;
      data[prefix] = current + 1;
      tx.update(codesRef as any, { [prefix]: data[prefix] });
    }
  });

  return nextCode;
};

export const updateSeries = async (id: string, updates: Partial<Series>): Promise<void> => {
  const docRef = doc(db, 'series', id);
  await updateDoc(docRef, updates);
};

export const deleteSeries = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'series', id));
};

// ==================== PAYMENTS ====================

export const getAllPayments = async (): Promise<StudentPayment[]> => {
  const querySnapshot = await getDocs(collection(db, 'payments'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentPayment));
};

export const getPaymentsByUserId = async (userId: string): Promise<StudentPayment[]> => {
  const q = query(collection(db, 'payments'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentPayment));
};

export const getPaymentsByStatus = async (status: string): Promise<StudentPayment[]> => {
  const q = query(collection(db, 'payments'), where('status', '==', status));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentPayment));
};

export const createPayment = async (payment: Omit<StudentPayment, 'id'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'payments'), payment);
  return docRef.id;
};

export const updatePayment = async (id: string, updates: Partial<StudentPayment>): Promise<void> => {
  const docRef = doc(db, 'payments', id);
  await updateDoc(docRef, updates);
};

export const deletePayment = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'payments', id));
};

// ==================== CLEAR ALL USER DATA ====================

export const clearAllUserData = async (userId: string): Promise<void> => {
  const batch = writeBatch(db);
  
  // Delete user profile
  const userRef = doc(db, 'users', userId);
  batch.delete(userRef);
  
  // Delete user's courses
  const coursesQuery = query(collection(db, 'courses'), where('userId', '==', userId));
  const coursesSnapshot = await getDocs(coursesQuery);
  coursesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
  
  // Delete user's payments
  const paymentsQuery = query(collection(db, 'payments'), where('userId', '==', userId));
  const paymentsSnapshot = await getDocs(paymentsQuery);
  paymentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
  
  await batch.commit();
};

export const clearAllCourses = async (): Promise<void> => {
  const querySnapshot = await getDocs(collection(db, 'courses'));
  const batch = writeBatch(db);
  querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

export const clearAllResources = async (): Promise<void> => {
  const querySnapshot = await getDocs(collection(db, 'resources'));
  const batch = writeBatch(db);
  querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

export const clearAllExams = async (): Promise<void> => {
  const querySnapshot = await getDocs(collection(db, 'exams'));
  const batch = writeBatch(db);
  querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
};

// ==================== RESOURCES (ALL) ====================

export const getAllResources = async (): Promise<Resource[]> => {
  const querySnapshot = await getDocs(collection(db, 'resources'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
};
