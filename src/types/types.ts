export interface Course {
  id: string;
  code: string;
  name: string;
  professor: string;
  progress: number;
  credits: number;
  status: 'Active' | 'Completed' | 'Upcoming';
  type: 'Core' | 'Elective';
  level: 'L1' | 'L2' | 'L3' | 'M1' | 'M2';
  semester: 1 | 2;
  academicYear: string; // e.g., "2023-2024" or "2024-2025"
  language?: 'fr' | 'en'; // Course teaching language (French/English)
  color: string;
  icon: string;
  userId?: string; // Optional: for user-specific courses
  // Resource availability flags
  hasCours?: boolean; // Has course chapters/materials
  hasTD?: boolean; // Has TD exercises
  hasTP?: boolean; // Has TP exercises
  hasExam?: boolean; // Has exam archives
  // Legacy fields for backward compatibility with old Firebase data
  hasTDSolution?: boolean;
  hasTPSolution?: boolean;
  hasExamSolution?: boolean;
}


export interface Series {
  id?: string;
  courseId: string;
  title: string;
  type: 'TD' | 'TP' | 'Exam';
  description?: string;
  driveUrl: string; // Main series file
  solutionUrl?: string; // Optional solution file
  hasSolution: boolean;
  date: string;
  academicYear?: string;
}


export interface Resource {
  id?: string;
  courseId: string;
  title: string;
  chapterNumber: number; // Chapter number for ordering
  description?: string;
  driveUrl: string; // Google Drive URL for the chapter
  date: string;
  academicYear?: string; // Links to specific course year
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  date: string;
  type: 'Midterm' | 'Final' | 'Resit' | 'Quiz';
  url: string;
}

export interface StudentPayment {
  id: string;
  userId: string;
  name: string;
  studentId: string;
  department: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface UserProfile {
  id: string; // Same as Firebase Auth UID
  email: string;
  displayName: string;
  studentId: string;
  role: 'student' | 'admin'; // User role
  phone?: string;
  address?: string;
  photoURL?: string; // Profile picture URL
  major?: string;
  minor?: string;
  year?: string;
  enrollmentYear?: string;
  gpa?: string;
  advisor?: string;
  status?: 'Active' | 'Inactive' | 'Graduated';
  creditsEarned?: number;
  createdAt: string;
  updatedAt: string;
}