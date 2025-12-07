import { LearningStyle, Role, EnrollmentStatus, CertificateLevel, ApplicationStatus, ExamStatus } from "@prisma/client";

// Re-export Prisma enums for convenience
export { LearningStyle, Role, EnrollmentStatus, CertificateLevel, ApplicationStatus, ExamStatus };

// User types
export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  emailVerified: Date | null;
}

// Aptitude test types
export interface AptitudeQuestion {
  id: string;
  category: "interests" | "skills" | "personality" | "learning_style" | "career_goals";
  question: string;
  type: "single_choice" | "multiple_choice" | "scale" | "text";
  options?: AptitudeOption[];
  minValue?: number;
  maxValue?: number;
}

export interface AptitudeOption {
  id: string;
  text: string;
  value: string | number;
  icon?: string;
}

export interface AptitudeAnswer {
  questionId: string;
  answer: string | string[] | number;
}

export interface AptitudeResults {
  learningStyle: LearningStyle;
  interests: string[];
  strengths: string[];
  weaknesses: string[];
  personalityTraits: string[];
  careerGoals: string[];
  rawAnswers: AptitudeAnswer[];
  completedAt: Date;
}

// Career recommendation types
export interface CareerRecommendation {
  id: string;
  title: string;
  description: string;
  matchScore: number; // 0-100
  demandScore: number; // Job market demand
  skills: string[];
  educationPath: string[];
  averageSalary?: string;
  growthOutlook?: string;
}

export interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  matchScore: number; // 0-100 alignment with interests
  level: string;
  duration: string;
  skills: string[];
  careerPaths: string[];
}

// Course progress types
export interface TopicProgressData {
  topicId: string;
  title: string;
  order: number;
  videoWatched: boolean;
  videoProgress: number;
  quizPassed: boolean;
  quizScore: number | null;
  isCompleted: boolean;
  isLocked: boolean;
}

export interface CourseProgressData {
  courseId: string;
  title: string;
  progress: number;
  status: EnrollmentStatus;
  topics: TopicProgressData[];
  canTakeExam: boolean;
}

// Quiz types
export interface QuizQuestionData {
  id: string;
  question: string;
  options: string[];
  order: number;
}

export interface QuizSubmission {
  quizId: string;
  answers: Record<string, number>; // questionId -> selected option index
}

export interface QuizResult {
  quizId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  feedback: QuizFeedback[];
}

export interface QuizFeedback {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: number;
  userAnswer: number;
  explanation?: string;
}

// Exam types
export interface ExamScheduleData {
  id: string;
  courseId: string;
  courseTitle: string;
  scheduledAt: Date;
  duration: number;
  status: ExamStatus;
}

// Certificate types
export interface CertificateData {
  id: string;
  courseTitle: string;
  studentName: string;
  level: CertificateLevel;
  examScore: number;
  issueDate: Date;
  certificateNumber: string;
  blockchainHash?: string;
  certificateUrl?: string;
}

// Job types
export interface JobListingData {
  id: string;
  title: string;
  company: {
    name: string;
    logo?: string;
  };
  location?: string;
  jobType?: string;
  salaryRange?: string;
  requiredSkills: string[];
  isDirectPlacement: boolean;
  createdAt: Date;
}

export interface JobApplicationData {
  id: string;
  job: JobListingData;
  status: ApplicationStatus;
  appliedAt: Date;
  coverLetter?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form types
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

