import { SiteSettings, AppUser, Student, Teacher, SupportSession, StudyResource, AppNotification, QuizSubmission, AdminActivityLog, Quiz } from './types';

export interface FullDatabaseState {
  siteSettings: SiteSettings;
  adminUser: AppUser;
  students: Student[];
  teachers: Teacher[];
  sessions: SupportSession[];
  resources?: StudyResource[];
  notifications?: AppNotification[];
  quizSubmissions?: QuizSubmission[];
  activityLogs?: AdminActivityLog[];
  quizzes?: Quiz[];
}

export const api = {
  // Fetch central database from server
  async getFullData(): Promise<FullDatabaseState | null> {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('Backend API offline or unreachable, using local storage cache.');
      return null;
    }
  },

  // Login via server
  async login(identifier: string, password: string): Promise<{ user?: AppUser; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'فشل تسجيل الدخول' };
      }
      return { user: data.user };
    } catch (e) {
      return { error: 'تعذر الاتصال بالسيرفر' };
    }
  },

  // Request password reset (OTP code & Reset link via email)
  async forgotPassword(emailOrIdentifier: string, actionType: 'send_code_and_link' | 'send_temp_password' = 'send_code_and_link') {
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrIdentifier, actionType }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'تعذر معالجة الطلب' };
      }
      return { success: true, ...data };
    } catch (e) {
      return { success: false, error: 'تعذر الاتصال بالخادم المركزي' };
    }
  },

  // Verify OTP code or token
  async verifyResetCode(code: string, token?: string) {
    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      return { success: true, ...data };
    } catch (e) {
      return { success: false, error: 'خطأ في الاتصال' };
    }
  },

  // Confirm password reset
  async resetPassword(code: string, newPassword: string, token?: string) {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, newPassword, token }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      return { success: true, ...data };
    } catch (e) {
      return { success: false, error: 'خطأ في الاتصال بالسيرفر' };
    }
  },

  // Save Site Settings
  async saveSiteSettings(settings: SiteSettings) {
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
    } catch (e) {}
  },

  // Save Admin Credentials
  async saveAdminCredentials(creds: Partial<AppUser>) {
    try {
      await fetch('/api/admin/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
    } catch (e) {}
  },

  // Register Student
  async registerStudent(student: Student) {
    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student),
      });
    } catch (e) {}
  },

  // Delete Student (ADMIN ONLY)
  async deleteStudent(studentId: string) {
    try {
      await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      });
    } catch (e) {}
  },

  // Toggle Hide Student (ADMIN ONLY)
  async toggleHideStudent(studentId: string, isHidden: boolean) {
    try {
      await fetch(`/api/students/${studentId}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden }),
      });
    } catch (e) {}
  },

  // Add Teacher (Admin)
  async addTeacher(teacher: Teacher) {
    try {
      await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacher),
      });
    } catch (e) {}
  },

  // Delete Teacher (ADMIN ONLY)
  async deleteTeacher(teacherId: string) {
    try {
      await fetch(`/api/teachers/${teacherId}`, {
        method: 'DELETE',
      });
    } catch (e) {}
  },

  // Toggle Hide Teacher (ADMIN ONLY)
  async toggleHideTeacher(teacherId: string, isHidden: boolean) {
    try {
      await fetch(`/api/teachers/${teacherId}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden }),
      });
    } catch (e) {}
  },

  // Add Session
  async addSession(session: SupportSession) {
    try {
      await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
    } catch (e) {}
  },

  // Delete Session (Teachers & Admin)
  async deleteSession(sessionId: string) {
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
    } catch (e) {}
  },

  // Toggle Hide Session (Teachers & Admin)
  async toggleHideSession(sessionId: string, isHidden: boolean) {
    try {
      await fetch(`/api/sessions/${sessionId}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden }),
      });
    } catch (e) {}
  },

  // Update Attendance
  async updateAttendance(sessionId: string, attendanceRecord: any, pedagogicalNotes: string) {
    try {
      await fetch(`/api/sessions/${sessionId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendanceRecord, pedagogicalNotes }),
      });
    } catch (e) {}
  },

  // Add Resource (Teachers & Admin)
  async addResource(resource: StudyResource) {
    try {
      await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resource),
      });
    } catch (e) {}
  },

  // Delete Resource (Teachers & Admin)
  async deleteResource(resourceId: string) {
    try {
      await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
      });
    } catch (e) {}
  },

  // Toggle Hide Resource (Teachers & Admin)
  async toggleHideResource(resourceId: string, isHidden: boolean) {
    try {
      await fetch(`/api/resources/${resourceId}/hide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden }),
      });
    } catch (e) {}
  },

  // Publish Quiz
  async publishQuiz(quiz: Quiz) {
    try {
      await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quiz),
      });
    } catch (e) {}
  },

  // Sync Firebase Auth User with DB
  async syncFirebaseUser(userData: any) {
    try {
      const res = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  },
};
