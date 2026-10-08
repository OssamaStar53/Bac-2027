import { pgTable, serial, text, integer, boolean, timestamp, jsonb, real } from 'drizzle-orm/pg-core';

// Users table (maps Firebase Auth UID or system accounts)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email'),
  role: text('role').notNull().default('student'),
  username: text('username'),
  phone: text('phone'),
  fullName: text('full_name'),
  relatedId: text('related_id'),
  wilaya: text('wilaya'),
  stream: text('stream'),
  subject: text('subject'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Students table
export const students = pgTable('students', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  username: text('username'),
  password: text('password'),
  stream: text('stream').notNull(),
  educationLevel: text('education_level').default('BAC'),
  phone: text('phone'),
  parentPhone: text('parent_phone'),
  wilaya: text('wilaya'),
  highSchool: text('high_school'),
  enrolledSubjects: jsonb('enrolled_subjects').$type<string[]>(),
  attendanceRate: integer('attendance_rate').default(0),
  averageScore: real('average_score').default(0),
  weaknesses: jsonb('weaknesses').$type<string[]>(),
  strengths: jsonb('strengths').$type<string[]>(),
  monthlyProgression: jsonb('monthly_progression'),
  registrationDate: text('registration_date'),
  notes: text('notes'),
  avatarSeed: text('avatar_seed'),
  avatarUrl: text('avatar_url'),
  isHidden: boolean('is_hidden').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Teachers table
export const teachers = pgTable('teachers', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  username: text('username'),
  password: text('password'),
  subject: text('subject').notNull(),
  coveredStreams: jsonb('covered_streams').$type<string[]>(),
  phone: text('phone'),
  email: text('email'),
  bio: text('bio'),
  volunteerHours: integer('volunteer_hours').default(0),
  centerName: text('center_name'),
  activeSessionsCount: integer('active_sessions_count').default(0),
  avatarUrl: text('avatar_url'),
  isHidden: boolean('is_hidden').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Support Sessions table
export const supportSessions = pgTable('support_sessions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  stream: text('stream').notNull(),
  educationLevel: text('education_level').default('BAC'),
  teacherId: text('teacher_id').notNull(),
  teacherName: text('teacher_name').notNull(),
  date: text('date').notNull(),
  timeText: text('time_text').notNull(),
  location: text('location').notNull(),
  description: text('description'),
  completed: boolean('completed').default(false),
  attendance: jsonb('attendance'),
  pedagogicalNotes: text('pedagogical_notes'),
  attachedResourceTitle: text('attached_resource_title'),
  isHidden: boolean('is_hidden').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Study Resources table
export const studyResources = pgTable('study_resources', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  stream: text('stream').notNull(),
  educationLevel: text('education_level').default('BAC'),
  type: text('type').notNull(),
  teacherName: text('teacher_name').notNull(),
  uploadDate: text('upload_date').notNull(),
  downloadCount: integer('download_count').default(0),
  fileSize: text('file_size'),
  description: text('description'),
  contentPreview: text('content_preview'),
  hasSolution: boolean('has_solution').default(false),
  solutionText: text('solution_text'),
  pdfDataUrl: text('pdf_data_url'),
  pdfFileName: text('pdf_file_name'),
  isHidden: boolean('is_hidden').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Quizzes table
export const quizzes = pgTable('quizzes', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subject: text('subject').notNull(),
  stream: text('stream').notNull(),
  educationLevel: text('education_level').default('BAC'),
  durationMinutes: integer('duration_minutes').default(20),
  totalQuestions: integer('total_questions').default(5),
  questions: jsonb('questions').notNull(),
  teacherId: text('teacher_id'),
  teacherName: text('teacher_name'),
  createdAt: text('created_at'),
  isCustomTeacherQuiz: boolean('is_custom_teacher_quiz').default(false),
});

// Quiz Submissions table
export const quizSubmissions = pgTable('quiz_submissions', {
  id: text('id').primaryKey(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  quizId: text('quiz_id').notNull(),
  quizTitle: text('quiz_title').notNull(),
  score: real('score').notNull(),
  correctCount: integer('correct_count').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  timestamp: text('timestamp').notNull(),
  answers: jsonb('answers'),
  weaknesses: jsonb('weaknesses').$type<string[]>(),
});

// App Notifications table
export const appNotifications = pgTable('app_notifications', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  date: text('date').notNull(),
  type: text('type').notNull(),
  targetStream: text('target_stream'),
  targetRole: text('target_role'),
  targetTeacherId: text('target_teacher_id'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Site Settings table
export const siteSettingsTable = pgTable('site_settings', {
  id: integer('id').primaryKey().default(1),
  settings: jsonb('settings').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Admin Activity Logs table
export const adminActivityLogs = pgTable('admin_activity_logs', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  category: text('category').notNull(),
});
