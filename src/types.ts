export type EducationLevel = 'BAC' | 'BEM';

export type BacStream = 
  | 'السنة الرابعة متوسط (BEM)'
  | 'علوم تجريبية'
  | 'رياضيات'
  | 'تقني رياضي'
  | 'تسيير واقتصاد'
  | 'آداب وفلسفة'
  | 'لغات أجنبية';

export const BEM_STREAMS: BacStream[] = ['السنة الرابعة متوسط (BEM)'];
export const BAC_STREAMS: BacStream[] = [
  'علوم تجريبية',
  'رياضيات',
  'تقني رياضي',
  'تسيير واقتصاد',
  'آداب وفلسفة',
  'لغات أجنبية',
];

export const ALL_STREAMS: BacStream[] = [
  'السنة الرابعة متوسط (BEM)',
  'علوم تجريبية',
  'رياضيات',
  'تقني رياضي',
  'تسيير واقتصاد',
  'آداب وفلسفة',
  'لغات أجنبية',
];

export const BEM_SUBJECTS = [
  'الرياضيات',
  'العلوم الفيزيائية والتكنولوجيا',
  'علوم الطبيعة والحياة',
  'اللغة العربية',
  'اللغة الفرنسية',
  'اللغة الإنجليزية',
  'التاريخ والجغرافيا',
  'التربية الإسلامية',
  'التربية المدنية',
];

export const BAC_SUBJECTS = [
  'الرياضيات',
  'العلوم الفيزيائية',
  'علوم الطبيعة والحياة',
  'الفلسفة',
  'اللغة العربية وآدابها',
  'اللغة الفرنسية',
  'اللغة الإنجليزية',
  'التاريخ والجغرافيا',
  'العلوم الإسلامية',
  'المحاسبة والمالية',
  'الهندسة الميكانيكية',
  'الهندسة الكهربائية',
  'الهندسة المدنية',
];

export type UserRole = 'student' | 'teacher' | 'association_admin';

export interface AppUser {
  id: string;
  role: UserRole;
  username: string;
  phone: string;
  email?: string;
  password: string;
  fullName: string;
  relatedId: string; // matches studentId or teacherId
  wilaya?: string;
  stream?: BacStream;
  subject?: string;
  recoveryEmail?: string;
  recoveryCode?: string; // Secret recovery key for admin
  avatarUrl?: string; // Custom profile image URL or base64 data
}

export interface AdminActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  category: 'settings' | 'security' | 'telegram' | 'session' | 'student' | 'teacher';
}

export interface SiteSettings {
  siteName: string;
  siteSubtitle: string;
  badgeText: string;
  logoIcon: 'seed' | 'book' | 'cap' | 'award' | 'shield';
  customLogoUrl?: string;
  footerAssociationName: string;
  footerDescription: string;
  phone: string;
  secondaryPhone?: string;
  email: string;
  address: string;
  workingHoursNote?: string;
  copyrightText: string;
  // Urgent announcement banner at top of site
  urgentAnnouncementEnabled: boolean;
  urgentAnnouncementText: string;
  bannerColor?: 'amber' | 'emerald' | 'rose' | 'sky';
  // Session Privacy / Gating
  sessionGatingEnabled: boolean;
  // Registration control
  registrationOpen: boolean;
  maxStudentCapacity: number;
  // Telegram Bot integration
  telegramBotEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  autoNotifyNewStudent: boolean;
  autoNotifyNewSession: boolean;
  autoNotifyNewResource: boolean;
  // WhatsApp Channel & Automated Notifications Integration
  whatsappBotEnabled?: boolean;
  whatsappChannelUrl?: string;
  whatsappWebhookUrl?: string;
  whatsappApiKey?: string;
  whatsappPhoneOrGroup?: string;
  autoNotifyWhatsAppNewStudent?: boolean;
  autoNotifyWhatsAppNewSession?: boolean;
  autoNotifyWhatsAppNewResource?: boolean;
  // Social links
  facebookUrl: string;
  telegramChannelUrl: string;
  whatsappContact: string;
  youtubeUrl?: string;
  instagramUrl?: string;
  // Customizable PDF Header
  pdfHeaderTitle?: string;
  pdfHeaderSubtitle?: string;
}

export interface MonthlyProgress {
  month: string;
  attendance: number;
  score: number; // out of 20
}

export interface Student {
  id: string;
  fullName: string;
  username?: string;
  email?: string;
  password?: string;
  stream: BacStream;
  educationLevel?: EducationLevel;
  phone: string;
  parentPhone: string;
  wilaya: string;
  highSchool: string; // اسم المؤسسة (ثانوية أو متوسطة)
  enrolledSubjects: string[];
  attendanceRate: number; // percentage e.g. 85
  averageScore: number; // e.g. 14.2
  weaknesses: string[]; // e.g. ['الرياضيات', 'الفيزياء']
  strengths: string[];
  monthlyProgression: MonthlyProgress[];
  registrationDate: string;
  notes?: string;
  avatarSeed: string;
  avatarUrl?: string; // Custom uploaded profile photo
  isHidden?: boolean; // Hidden/deactivated by admin
}

export interface Teacher {
  id: string;
  fullName: string;
  username?: string;
  password?: string;
  subject: string;
  coveredStreams: BacStream[];
  phone: string;
  email: string;
  bio: string;
  volunteerHours: number;
  centerName: string;
  activeSessionsCount: number;
  avatarUrl?: string; // Custom uploaded profile photo
  isHidden?: boolean; // Suspended/hidden by admin
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface SupportSession {
  id: string;
  title: string;
  subject: string;
  stream: BacStream;
  educationLevel?: EducationLevel;
  teacherId: string;
  teacherName: string;
  date: string;
  timeText: string; // e.g. "17:30 (بعد صلاة المغرب)"
  location: string; // e.g. "دار الشباب - قاعة المحاضرات 1"
  description: string;
  completed: boolean;
  attendance: Record<string, AttendanceStatus>; // studentId -> status
  pedagogicalNotes?: string;
  attachedResourceTitle?: string;
  isHidden?: boolean;
}

export interface StudyResource {
  id: string;
  title: string;
  subject: string;
  stream: BacStream;
  educationLevel?: EducationLevel;
  type: 'summary' | 'exercise' | 'cheatsheet';
  teacherName: string;
  uploadDate: string;
  downloadCount: number;
  fileSize: string;
  description: string;
  contentPreview: string;
  hasSolution: boolean;
  solutionText?: string;
  pdfDataUrl?: string; // Real base64 PDF document or download URL
  pdfFileName?: string;
  isHidden?: boolean;
}

export interface BacArchiveItem {
  id: string;
  year: number;
  stream: BacStream;
  educationLevel?: EducationLevel;
  examType?: 'BAC' | 'BEM';
  subject: string;
  sessionType: 'الدورة العادية' | 'الدورة الاستدراكية';
  topics: {
    topicNumber: 1 | 2;
    title: string;
    exercises: string[];
    solutionSummary: string;
    keyPoints: string[];
  }[];
}

export interface QuizQuestion {
  id: number;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topic: string; // e.g. "الدوال العددية", "الحساب على الجذور"
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  stream: BacStream;
  educationLevel?: EducationLevel;
  durationMinutes: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  teacherId?: string;
  teacherName?: string;
  createdAt?: string;
  isCustomTeacherQuiz?: boolean;
}

export interface QuizSubmission {
  id: string;
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  score: number; // out of 20
  correctCount: number;
  totalQuestions: number;
  timestamp: string;
  answers: Record<number, number>; // questionId -> selectedOption
  weaknesses: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'session' | 'exam' | 'reminder' | 'general' | 'teacher_alert';
  targetStream?: BacStream | 'الكل';
  targetRole?: 'all' | 'students' | 'teachers' | 'admins';
  targetTeacherId?: string; // if specifically for one teacher
  read: boolean;
  createdAt?: string | number | Date;
  timestamp?: number;
}
