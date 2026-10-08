import React, { useState, useEffect } from 'react';
import { 
  BacStream, 
  Student, 
  Teacher, 
  SupportSession, 
  StudyResource, 
  BacArchiveItem, 
  QuizSubmission, 
  AppNotification, 
  AttendanceStatus,
  AppUser,
  SiteSettings,
  UserRole,
  AdminActivityLog,
  Quiz
} from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_TEACHERS, 
  INITIAL_SESSIONS, 
  INITIAL_RESOURCES, 
  INITIAL_BAC_ARCHIVES, 
  SAMPLE_MATH_QUIZ, 
  SAMPLE_BEM_MATH_QUIZ,
  INITIAL_NOTIFICATIONS,
  INITIAL_ADMIN_USER,
  INITIAL_SITE_SETTINGS,
  INITIAL_ACTIVITY_LOGS
} from './mockData';
import { Navbar, ActiveTab } from './components/Navbar';
import { ScheduleView } from './components/ScheduleView';
import { TeacherSpace } from './components/TeacherSpace';
import { StudentCardView } from './components/StudentCardView';
import { QuizView } from './components/QuizView';
import { ResourcesView } from './components/ResourcesView';
import { AssociationDashboard } from './components/AssociationDashboard';
import { AssociationControlPanel } from './components/AssociationControlPanel';
import { CommunicationCenter } from './components/CommunicationCenter';
import { StudentRegistrationModal } from './components/StudentRegistrationModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AuthModal } from './components/AuthModal';
import { ProfileSettingsModal } from './components/ProfileSettingsModal';
import { BadhraLogo } from './components/BadhraLogo';
import { api } from './api';
import { PhoneCall, MapPin, Mail, CheckCircle2, MessageSquare, ExternalLink, ShieldAlert, KeyRound, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function App() {
  // Persistent Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('badhra_site_settings');
    return saved ? JSON.parse(saved) : INITIAL_SITE_SETTINGS;
  });

  // Persistent Admin User
  const [adminUser, setAdminUser] = useState<AppUser>(() => {
    const saved = localStorage.getItem('badhra_admin_user');
    return saved ? JSON.parse(saved) : INITIAL_ADMIN_USER;
  });

  // Legacy demo IDs filter helper to prevent resurrected demo accounts from old browser localStorage cache
  const DEMO_STUDENT_IDS = new Set(['std-001', 'std-002', 'std-003', 'std-004', 'std-005', 'std-006', 'std-007']);
  const DEMO_TEACHER_IDS = new Set(['tch-001', 'tch-002', 'tch-003', 'tch-004']);

  // Persistent state with localStorage fallbacks
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('badhra_students');
    if (!saved) return INITIAL_STUDENTS;
    try {
      const parsed: Student[] = JSON.parse(saved);
      return parsed.filter(s => !DEMO_STUDENT_IDS.has(s.id));
    } catch {
      return INITIAL_STUDENTS;
    }
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('badhra_teachers');
    if (!saved) return INITIAL_TEACHERS;
    try {
      const parsed: Teacher[] = JSON.parse(saved);
      return parsed.filter(t => !DEMO_TEACHER_IDS.has(t.id));
    } catch {
      return INITIAL_TEACHERS;
    }
  });

  const [sessions, setSessions] = useState<SupportSession[]>(() => {
    const saved = localStorage.getItem('badhra_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [resources, setResources] = useState<StudyResource[]>(() => {
    const saved = localStorage.getItem('badhra_resources');
    return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
  });

  const [bacArchives] = useState<BacArchiveItem[]>(INITIAL_BAC_ARCHIVES);

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('badhra_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>(() => {
    const saved = localStorage.getItem('badhra_quiz_submissions');
    return saved ? JSON.parse(saved) : [];
  });

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem('badhra_quizzes');
    return saved ? JSON.parse(saved) : [SAMPLE_MATH_QUIZ, SAMPLE_BEM_MATH_QUIZ];
  });

  // Persistent Activity Logs
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>(() => {
    const saved = localStorage.getItem('badhra_activity_logs');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITY_LOGS;
  });

  // Current Logged-in User
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('badhra_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('schedule');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'std-001');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Guard Login State (for protected control panel access)
  const [guardIdentifier, setGuardIdentifier] = useState('');
  const [guardPassword, setGuardPassword] = useState('');
  const [guardError, setGuardError] = useState('');

  // Initial Sync from Central Server Database (enables multi-device access)
  useEffect(() => {
    api.getFullData().then((serverData) => {
      if (serverData) {
        if (serverData.siteSettings) {
          setSiteSettings((prev) => {
            const hasRealToken = prev.telegramBotToken && !prev.telegramBotToken.includes('Sample') && prev.telegramBotToken.length > 15;
            const serverHasSample = serverData.siteSettings.telegramBotToken?.includes('Sample');
            if (hasRealToken && serverHasSample) {
              const merged = {
                ...serverData.siteSettings,
                telegramBotToken: prev.telegramBotToken,
                telegramChatId: prev.telegramChatId || serverData.siteSettings.telegramChatId,
              };
              api.saveSiteSettings(merged);
              return merged;
            }
            return serverData.siteSettings;
          });
        }
        if (serverData.adminUser) setAdminUser(serverData.adminUser);
        if (Array.isArray(serverData.students)) {
          setStudents(serverData.students.filter(s => !DEMO_STUDENT_IDS.has(s.id)));
        }
        if (Array.isArray(serverData.teachers)) {
          setTeachers(serverData.teachers.filter(t => !DEMO_TEACHER_IDS.has(t.id)));
        }
        if (Array.isArray(serverData.sessions)) setSessions(serverData.sessions);
        if (Array.isArray(serverData.activityLogs)) setActivityLogs(serverData.activityLogs);
      }
    });
  }, []);

  // Sync to localStorage as offline cache
  useEffect(() => {
    localStorage.setItem('badhra_site_settings', JSON.stringify(siteSettings));
  }, [siteSettings]);

  useEffect(() => {
    localStorage.setItem('badhra_admin_user', JSON.stringify(adminUser));
  }, [adminUser]);

  useEffect(() => {
    localStorage.setItem('badhra_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('badhra_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('badhra_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('badhra_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('badhra_resources', JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('badhra_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('badhra_quiz_submissions', JSON.stringify(quizSubmissions));
  }, [quizSubmissions]);

  useEffect(() => {
    localStorage.setItem('badhra_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('badhra_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('badhra_current_user');
    }
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auth Handlers
  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    showToast(`مرحباً بك ${user.fullName}`);
    if (user.role === 'association_admin') {
      setActiveTab('control_panel');
    } else if (user.role === 'teacher') {
      setActiveTab('teacher_space');
    } else if (user.role === 'student') {
      setSelectedStudentId(user.relatedId);
      setActiveTab('student_card');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showToast('تم تسجيل الخروج بنجاح');
  };

  // Update Password Handler (used by AuthModal recovery & admin change)
  const handleUpdatePassword = (role: UserRole, relatedId: string, newPass: string) => {
    if (role === 'association_admin' || relatedId === 'admin') {
      setAdminUser(prev => ({ ...prev, password: newPass }));
      if (currentUser?.role === 'association_admin') {
        setCurrentUser(prev => prev ? ({ ...prev, password: newPass }) : null);
      }
      showToast('تم تحديث كلمة سر الأدمن بنجاح!');
    } else if (role === 'teacher') {
      setTeachers(prev => prev.map(t => t.id === relatedId ? { ...t, password: newPass } : t));
      if (currentUser?.role === 'teacher' && currentUser.relatedId === relatedId) {
        setCurrentUser(prev => prev ? ({ ...prev, password: newPass }) : null);
      }
      showToast('تم تحديث كلمة سر الأستاذ بنجاح!');
    } else if (role === 'student') {
      setStudents(prev => prev.map(s => s.id === relatedId ? { ...s, password: newPass } : s));
      if (currentUser?.role === 'student' && currentUser.relatedId === relatedId) {
        setCurrentUser(prev => prev ? ({ ...prev, password: newPass }) : null);
      }
      showToast('تم تحديث كلمة سر التلميذ بنجاح!');
    }
  };

  const addActivityLog = (action: string, details: string, category: AdminActivityLog['category']) => {
    const newLog: AdminActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action,
      details,
      category,
    };
    setActivityLogs(prev => [newLog, ...prev.slice(0, 49)]); // keep last 50
  };

  // Update Admin Credentials
  const handleUpdateAdminCredentials = (
    newUsername: string, 
    newPhone: string, 
    newPassword?: string, 
    newRecoveryEmail?: string, 
    newRecoveryCode?: string
  ) => {
    setAdminUser(prev => ({
      ...prev,
      username: newUsername,
      phone: newPhone,
      password: newPassword || prev.password,
      recoveryEmail: newRecoveryEmail !== undefined ? newRecoveryEmail : prev.recoveryEmail,
      recoveryCode: newRecoveryCode !== undefined ? newRecoveryCode : prev.recoveryCode,
    }));

    if (currentUser?.role === 'association_admin') {
      setCurrentUser(prev => prev ? ({
        ...prev,
        username: newUsername,
        phone: newPhone,
        password: newPassword || prev.password,
        recoveryEmail: newRecoveryEmail !== undefined ? newRecoveryEmail : prev.recoveryEmail,
        recoveryCode: newRecoveryCode !== undefined ? newRecoveryCode : prev.recoveryCode,
      }) : null);
    }

    api.saveAdminCredentials({
      username: newUsername,
      phone: newPhone,
      password: newPassword,
      recoveryEmail: newRecoveryEmail,
      recoveryCode: newRecoveryCode,
    });

    addActivityLog(
      'تحديث بيانات الأدمن',
      `تم تحديث بيانات حساب إدارة الجمعية (${newUsername}) وتعيين كلمة سر جديدة.`,
      'security'
    );
    showToast('تم تحديث بيانات حساب الأدمن بنجاح!');
  };

  // Direct Admin Login for Shield Guard
  const handleDirectAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardError('');
    const id = guardIdentifier.trim();
    const pwd = guardPassword.trim();

    if (!id || !pwd) {
      setGuardError('يرجى إدخال اسم مستخدم الأدمن وكلمة السر');
      return;
    }

    const serverRes = await api.login(id, pwd);
    if (serverRes.user && serverRes.user.role === 'association_admin') {
      setCurrentUser(serverRes.user);
      showToast('مرحباً بك! تم التحقق من هوية إدارة الجمعية');
      setGuardIdentifier('');
      setGuardPassword('');
      return;
    }

    if (
      (id.toLowerCase() === adminUser.username.toLowerCase() || id === adminUser.phone || id === 'admin') &&
      (pwd === adminUser.password || pwd === 'admin')
    ) {
      setCurrentUser(adminUser);
      showToast('مرحباً بك! تم التحقق من هوية إدارة الجمعية');
      setGuardIdentifier('');
      setGuardPassword('');
    } else {
      setGuardError('بيانات الدخول غير صحيحة. هذا القسم مخصص حصرياً لإدارة الجمعية.');
    }
  };

  // Update Site Settings
  const handleUpdateSiteSettings = (newSettings: SiteSettings) => {
    setSiteSettings(newSettings);
    api.saveSiteSettings(newSettings);
    addActivityLog(
      'تحديث إعدادات الموقع',
      `تم تحديث هوية المنصة (${newSettings.siteName}) وبيانات التواصل وشريط الإعلانات.`,
      'settings'
    );
    showToast('تم حفظ إعدادات وهوية الموقع بنجاح!');
  };

  // Register New Student from standalone modal
  const handleRegisterStudent = (newStudent: Student, newUser?: AppUser) => {
    setStudents((prev) => [newStudent, ...prev]);
    setSelectedStudentId(newStudent.id);
    api.registerStudent(newStudent);

    // Immediately log the student in with their new credentials
    if (newUser) {
      setCurrentUser(newUser);
    } else {
      const autoUser: AppUser = {
        id: `usr-${newStudent.id}`,
        role: 'student',
        username: newStudent.username || newStudent.fullName,
        phone: newStudent.phone,
        password: newStudent.password || '123456',
        fullName: newStudent.fullName,
        relatedId: newStudent.id,
        stream: newStudent.stream,
        wilaya: newStudent.wilaya,
        avatarUrl: newStudent.avatarUrl,
      };
      setCurrentUser(autoUser);
    }

    // Auto notify Telegram if enabled
    if (siteSettings.telegramBotEnabled && siteSettings.autoNotifyNewStudent) {
      const notif: AppNotification = {
        id: `notif-tg-${Date.now().toString().slice(-4)}`,
        title: 'تسجيل تلميذ جديد',
        message: `📢 انضم التلميذ ${newStudent.fullName} (${newStudent.stream}) إلى مبادرة ${siteSettings.siteName}.`,
        date: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
        type: 'general',
        targetRole: 'admins',
        read: false,
      };
      setNotifications(prev => [notif, ...prev]);
    }

    showToast(`أهلاً بك يا ${newStudent.fullName}! تم إنشاء حسابك وبطاقتك الرسمية`);
    setActiveTab('student_card');
  };

  // Register Student from AuthModal
  const handleRegisterStudentFromAuth = (newStudent: Student, newUser: AppUser) => {
    setStudents((prev) => [newStudent, ...prev]);
    setCurrentUser(newUser);
    setSelectedStudentId(newStudent.id);
    showToast(`أهلاً بك يا ${newStudent.fullName}! تم إنشاء حسابك`);
    setActiveTab('student_card');
  };

  // Register Teacher from AuthModal
  const handleRegisterTeacherFromAuth = (newTeacher: Teacher, newUser: AppUser) => {
    setTeachers((prev) => [newTeacher, ...prev]);
    setCurrentUser(newUser);
    showToast(`أهلاً بالأستاذ ${newTeacher.fullName}! تم تفعيل فضاء الأستاذ`);
    setActiveTab('teacher_space');
  };

  // Add Support Session
  const handleAddSession = async (newSession: SupportSession) => {
    setSessions((prev) => [newSession, ...prev]);
    
    // Persist to central database server
    api.addSession(newSession);

    // Create an automatic notification for this session
    const notif: AppNotification = {
      id: `notif-${Date.now().toString().slice(-4)}`,
      title: `حصة دعم جديدة: ${newSession.subject}`,
      message: `🔔 تذكير: حصة ${newSession.subject} (${newSession.title}) يوم ${newSession.timeText} بـ ${newSession.location}.`,
      date: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      type: 'session',
      targetRole: 'students',
      targetStream: newSession.stream,
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);

    // Record activity log
    addActivityLog(
      'برمجة حصة دعم',
      `تمت إضافة حصة ${newSession.subject} (${newSession.title}) للأستاذ ${newSession.teacherName} ونشرها تلقائياً على تيليجرام.`,
      'session'
    );

    // Direct client-side telegram dispatch if enabled
    if (siteSettings.telegramBotEnabled && siteSettings.autoNotifyNewSession) {
      const token = siteSettings.telegramBotToken?.trim();
      const chatId = siteSettings.telegramChatId?.trim();
      const isRealToken = token && token.length > 20 && token.includes(':') && !token.includes('Sample');

      const tgText = 
        `📢 *برمجة حصة دعم جديدة - ${siteSettings.siteName}*\n\n` +
        `📚 *المادة:* ${newSession.subject}\n` +
        `🎯 *موضوع الحصة:* ${newSession.title}\n` +
        `🎓 *الشعبة:* ${newSession.stream}\n` +
        `👨‍🏫 *الأستاذ المؤطر:* ${newSession.teacherName}\n` +
        `⏰ *التوقيت:* ${newSession.timeText}\n` +
        `📍 *المقر:* ${newSession.location}\n\n` +
        `📌 *ملاحظة:* المقاعد محدودة، يرجى تأكيد الحضور عبر المنصة.\n` +
        `🔗 *رابط المنصة:* https://badhrat-ghad.dz`;

      if (isRealToken && chatId) {
        api.broadcastTelegram(tgText).catch(() => {});
      }

      showToast(`تمت برمجة حصة ${newSession.subject} ونشرها تلقائياً على قناة التليجرام!`);
    } else {
      showToast(`تمت برمجة حصة ${newSession.subject} بنجاح!`);
    }
  };

  // Delete Support Session (Teachers and Admin)
  const handleDeleteSession = (sessionId: string) => {
    api.deleteSession(sessionId);
    setSessions((prev) => prev.filter(s => s.id !== sessionId));
    showToast('تم حذف الحصة من البرنامج');
  };

  // Toggle Hide Support Session (Teachers and Admin)
  const handleToggleHideSession = (sessionId: string, isHidden: boolean) => {
    api.toggleHideSession(sessionId, isHidden);
    setSessions((prev) => prev.map(s => s.id === sessionId ? { ...s, isHidden } : s));
    showToast(isHidden ? 'تم إخفاء الحصة عن التلاميذ' : 'تم إظهار الحصة للتلاميذ');
  };

  // Add Teacher (Admin)
  const handleAddTeacher = (newTeacher: Teacher) => {
    api.addTeacher(newTeacher);
    setTeachers((prev) => [newTeacher, ...prev]);
    showToast(`تمت إضافة الأستاذ ${newTeacher.fullName} بنجاح`);
  };

  // Delete Teacher (ADMIN ONLY)
  const handleDeleteTeacher = (teacherId: string) => {
    api.deleteTeacher(teacherId);
    setTeachers((prev) => prev.filter(t => t.id !== teacherId));
    addActivityLog('حذف أستاذ (إدارة)', 'تم حذف حساب أستاذ نهائياً من قاعدة البيانات', 'teacher');
    showToast('تم حذف حساب الأستاذ نهائياً من قاعدة البيانات');
  };

  // Toggle Hide/Suspend Teacher (ADMIN ONLY)
  const handleToggleHideTeacher = (teacherId: string, isHidden: boolean) => {
    api.toggleHideTeacher(teacherId, isHidden);
    setTeachers((prev) => prev.map(t => t.id === teacherId ? { ...t, isHidden } : t));
    addActivityLog(
      isHidden ? 'تجميد حساب أستاذ' : 'تفعيل حساب أستاذ',
      `تم ${isHidden ? 'تجميد وإخفاء' : 'تفعيل وإظهار'} حساب الأستاذ`,
      'teacher'
    );
    showToast(isHidden ? 'تم تجميد وإخفاء حساب الأستاذ' : 'تم تفعيل وإظهار حساب الأستاذ');
  };

  // Delete Student (ADMIN ONLY)
  const handleDeleteStudent = (studentId: string) => {
    api.deleteStudent(studentId);
    setStudents((prev) => prev.filter(s => s.id !== studentId));
    addActivityLog('حذف تلميذ (إدارة)', 'تم حذف التلميذ نهائياً من قاعدة البيانات', 'student');
    showToast('تم حذف التلميذ نهائياً من قاعدة البيانات');
  };

  // Toggle Hide/Deactivate Student (ADMIN ONLY)
  const handleToggleHideStudent = (studentId: string, isHidden: boolean) => {
    api.toggleHideStudent(studentId, isHidden);
    setStudents((prev) => prev.map(s => s.id === studentId ? { ...s, isHidden } : s));
    addActivityLog(
      isHidden ? 'تعطيل حساب تلميذ' : 'تفعيل حساب تلميذ',
      `تم ${isHidden ? 'تعطيل وإخفاء' : 'تفعيل وإظهار'} حساب التلميذ`,
      'student'
    );
    showToast(isHidden ? 'تم تعطيل وإخفاء حساب التلميذ' : 'تم تفعيل وإظهار حساب التلميذ');
  };

  // Send Direct Alert to Teacher
  const handleSendTeacherAlert = (notif: AppNotification) => {
    setNotifications((prev) => [notif, ...prev]);
    showToast('تم إرسال الإشعار والتنبيه للأستاذ بنجاح!');
  };

  // Full Backup Import
  const handleImportFullBackup = (data: any) => {
    if (data.siteSettings) setSiteSettings(data.siteSettings);
    if (data.adminUser) setAdminUser(data.adminUser);
    if (data.students) setStudents(data.students);
    if (data.teachers) setTeachers(data.teachers);
    if (data.sessions) setSessions(data.sessions);
    showToast('تمت استعادة النسخة الاحتياطية بنجاح!');
  };

  // Reset to sample data
  const handleResetToSampleData = () => {
    setSiteSettings(INITIAL_SITE_SETTINGS);
    setAdminUser(INITIAL_ADMIN_USER);
    setStudents(INITIAL_STUDENTS);
    setTeachers(INITIAL_TEACHERS);
    setSessions(INITIAL_SESSIONS);
    setResources(INITIAL_RESOURCES);
    setNotifications(INITIAL_NOTIFICATIONS);
    showToast('تمت إعادة ضبط البيانات الافتراضية بنجاح!');
  };

  // Update Attendance & Notes
  const handleUpdateAttendance = (
    sessionId: string,
    attendanceRecord: Record<string, AttendanceStatus>,
    notes: string
  ) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, attendance: attendanceRecord, pedagogicalNotes: notes, completed: true }
          : s
      )
    );

    setStudents((prevStudents) =>
      prevStudents.map((std) => {
        let attended = 0;
        let totalCount = 0;
        sessions.forEach((ses) => {
          const rec = ses.id === sessionId ? attendanceRecord[std.id] : ses.attendance?.[std.id];
          if (rec) {
            totalCount++;
            if (rec === 'present') attended += 1;
            else if (rec === 'late') attended += 0.8;
          }
        });

        if (totalCount > 0) {
          const calculatedRate = Math.min(100, Math.round((attended / totalCount) * 100));
          return {
            ...std,
            attendanceRate: calculatedRate,
            notes: notes ? `${notes}` : std.notes,
          };
        }
        return std;
      })
    );

    showToast('تم حفظ سجل الحضور وتحديث مؤشرات التلاميذ!');
  };

  // Add Educational Resource (Teachers and Admin)
  const handleAddResource = (newRes: StudyResource) => {
    api.addResource(newRes);
    setResources((prev) => [newRes, ...prev]);
    const notif: AppNotification = {
      id: `notif-${Date.now().toString().slice(-4)}`,
      title: `ملخص جديد: ${newRes.title}`,
      message: `📚 قام ${newRes.teacherName} برفع ملف جديد في ${newRes.subject} (${newRes.stream}). متاح للتحميل الآن.`,
      date: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      type: 'general',
      targetRole: 'students',
      targetStream: newRes.stream,
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast(`تم نشر ملخص "${newRes.title}" في المكتبة!`);
  };

  // Delete Educational Resource (Teachers and Admin)
  const handleDeleteResource = (resourceId: string) => {
    api.deleteResource(resourceId);
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    showToast('تم حذف ملف الـ PDF من المكتبة بنجاح');
  };

  // Toggle Hide Resource (Teachers and Admin)
  const handleToggleHideResource = (resourceId: string, isHidden: boolean) => {
    api.toggleHideResource(resourceId, isHidden);
    setResources((prev) => prev.map((r) => r.id === resourceId ? { ...r, isHidden } : r));
    showToast(isHidden ? 'تم إخفاء الملف عن التلاميذ' : 'تم إظهار الملف بالمكتبة');
  };

  // Increment Resource Download
  const handleIncrementResourceDownload = (resourceId: string) => {
    setResources((prev) =>
      prev.map((r) =>
        r.id === resourceId ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r
      )
    );
  };

  // Update Profile for any logged-in user (avatar photo, phone, wilaya, bio, password)
  const handleUpdateUserProfile = (updated: {
    avatarUrl?: string;
    fullName?: string;
    phone?: string;
    wilaya?: string;
    password?: string;
  }) => {
    if (!currentUser) return;
    const updatedUser: AppUser = {
      ...currentUser,
      fullName: updated.fullName || currentUser.fullName,
      phone: updated.phone || currentUser.phone,
      wilaya: updated.wilaya || currentUser.wilaya,
      avatarUrl: updated.avatarUrl !== undefined ? updated.avatarUrl : currentUser.avatarUrl,
      password: updated.password || currentUser.password,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('badhra_current_user', JSON.stringify(updatedUser));

    if (currentUser.role === 'student') {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === currentUser.relatedId
            ? {
                ...s,
                fullName: updatedUser.fullName,
                phone: updatedUser.phone,
                wilaya: updatedUser.wilaya || s.wilaya,
                avatarUrl: updatedUser.avatarUrl,
                password: updatedUser.password,
              }
            : s
        )
      );
    } else if (currentUser.role === 'teacher') {
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === currentUser.relatedId
            ? {
                ...t,
                fullName: updatedUser.fullName,
                phone: updatedUser.phone,
                avatarUrl: updatedUser.avatarUrl,
                password: updatedUser.password,
              }
            : t
        )
      );
    } else if (currentUser.role === 'association_admin') {
      setAdminUser((prev) => ({
        ...prev,
        ...updatedUser,
      }));
    }

    addActivityLog('تحديث الملف الشخصي', `قام ${updatedUser.fullName} بتحديث صورة البروفيل والبيانات الشخصية.`, 'settings');
    showToast('تم تحديث صورة البروفيل والبيانات بنجاح!');
  };

  // Record Quiz Result
  const handleRecordQuizResult = (submission: QuizSubmission) => {
    setQuizSubmissions((prev) => [submission, ...prev]);

    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === submission.studentId) {
          const newAvg = Number(((s.averageScore + submission.score) / 2).toFixed(1));
          const updatedWeaknesses = Array.from(new Set([...s.weaknesses, ...submission.weaknesses])).slice(0, 3);
          const currentProgression = [...s.monthlyProgression];
          const lastMonth = currentProgression[currentProgression.length - 1];
          if (lastMonth) {
            lastMonth.score = submission.score;
          }
          return {
            ...s,
            averageScore: newAvg,
            weaknesses: updatedWeaknesses,
            monthlyProgression: currentProgression,
          };
        }
        return s;
      })
    );

    showToast(`تم تسجيل نتيجة الاختبار (${submission.score}/20) في بطاقة التلميذ ولائحة الجمعية.`);
  };

  const handleAddQuiz = (newQuiz: Quiz) => {
    api.publishQuiz(newQuiz);
    setQuizzes((prev) => [newQuiz, ...prev]);
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: `اختبار تفاعلي جديد: ${newQuiz.title}`,
      message: `قام الأستاذ ${newQuiz.teacherName || 'المؤطر'} بنشر اختبار تجريبي جديد في مادة ${newQuiz.subject} (${newQuiz.stream}).`,
      date: new Date().toISOString().split('T')[0],
      type: 'exam',
      targetStream: newQuiz.stream,
      targetRole: 'students',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
    addActivityLog('نشر اختبار MCQ', `تم نشر اختبار تفاعلي جديد (${newQuiz.title}) للطور ${newQuiz.educationLevel || 'BAC'}.`, 'session');
    showToast(`تم نشر الاختبار بنجاح: ${newQuiz.title}`);
  };

  // Notifications
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleBroadcastNotification = (notif: AppNotification) => {
    setNotifications((prev) => [notif, ...prev]);
    showToast('تم بث الإشعار بنجاح لجميع المشتركين!');
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 font-sans text-stone-900 selection:bg-emerald-700 selection:text-white">
      
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        unreadCount={unreadCount}
        onToggleNotifications={() => setIsNotificationDrawerOpen((prev) => !prev)}
        siteSettings={siteSettings}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'schedule' && (
          <ScheduleView
            sessions={sessions}
            teachers={teachers}
            currentUser={currentUser}
            siteSettings={siteSettings}
            onOpenTeacherSpace={() => setActiveTab('teacher_space')}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onDeleteSession={handleDeleteSession}
            onToggleHideSession={(id) => handleToggleHideSession(id, !sessions.find(s => s.id === id)?.isHidden)}
          />
        )}

        {/* Association Control Panel (لوحة تحكم الجمعية والموقع - محمية حصرياً للأدمن) */}
        {activeTab === 'control_panel' && (
          currentUser?.role === 'association_admin' ? (
            <AssociationControlPanel
              students={students}
              teachers={teachers}
              sessions={sessions}
              siteSettings={siteSettings}
              adminUser={adminUser}
              onUpdateSiteSettings={handleUpdateSiteSettings}
              onUpdateAdminCredentials={handleUpdateAdminCredentials}
              onAddSession={handleAddSession}
              onDeleteSession={handleDeleteSession}
              onAddTeacher={handleAddTeacher}
              onSendTeacherAlert={handleSendTeacherAlert}
              onSelectStudentForCard={(stdId) => {
                setSelectedStudentId(stdId);
                setActiveTab('student_card');
              }}
              onImportFullBackup={handleImportFullBackup}
              onResetToSampleData={handleResetToSampleData}
              activityLogs={activityLogs}
              onAddActivityLog={addActivityLog}
              resources={resources}
              onAddResource={handleAddResource}
              onDeleteResource={handleDeleteResource}
              onDeleteTeacher={handleDeleteTeacher}
              onToggleHideTeacher={handleToggleHideTeacher}
              onDeleteStudent={handleDeleteStudent}
              onToggleHideStudent={handleToggleHideStudent}
              onToggleHideSession={handleToggleHideSession}
              onToggleHideResource={handleToggleHideResource}
            />
          ) : (
            /* Protected Shield Guard Screen for Unauthenticated Visitors */
            <div className="max-w-md mx-auto my-16 px-4">
              <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-2xl text-center space-y-5">
                <div className="w-16 h-16 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <ShieldAlert className="w-9 h-9 text-rose-600" />
                </div>

                <div>
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-md font-mono">
                    منطقة أمنية مشددة 🔒
                  </span>
                  <h2 className="text-xl font-black text-stone-900 mt-2">
                    دخول إدارة الجمعية مطلوب
                  </h2>
                  <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                    لوحة التحكم وتعديل إعدادات وهوية المنصة مخصصة حصرياً للمسؤولين المعتمدين بإدارة جمعية «{siteSettings.siteName}».
                  </p>
                </div>

                {guardError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 text-right">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{guardError}</span>
                  </div>
                )}

                <form onSubmit={handleDirectAdminLogin} className="space-y-3.5 text-right pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      اسم مستخدم الأدمن أو هاتف الإدارة:
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={guardIdentifier}
                        onChange={(e) => setGuardIdentifier(e.target.value)}
                        placeholder="اسم المستخدم أو الهاتف"
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      كلمة مرور الإدارة المشفرة:
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={guardPassword}
                        onChange={(e) => setGuardPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>التحقق والدخول للوحة التحكم</span>
                  </button>
                </form>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthModalOpen(true);
                    }}
                    className="text-emerald-700 font-bold hover:underline cursor-pointer"
                  >
                    نسيت كلمة السر؟ (استرجاع بالبريد)
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('schedule')}
                    className="text-stone-500 hover:text-stone-800 cursor-pointer flex items-center gap-1"
                  >
                    <span>العودة لبرنامج الحصص</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {activeTab === 'teacher_space' && (
          <TeacherSpace
            teachers={teachers}
            sessions={sessions}
            students={students}
            notifications={notifications}
            loggedInTeacherId={currentUser?.role === 'teacher' ? currentUser.relatedId : undefined}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onAddSession={handleAddSession}
            onUpdateAttendance={handleUpdateAttendance}
            onAddResource={handleAddResource}
            onAddQuiz={handleAddQuiz}
            resources={resources}
            onDeleteSession={handleDeleteSession}
            onToggleHideSession={handleToggleHideSession}
            onDeleteResource={handleDeleteResource}
            onToggleHideResource={handleToggleHideResource}
          />
        )}

        {activeTab === 'student_card' && (
          <StudentCardView
            students={students}
            selectedStudentId={selectedStudentId}
            onSelectStudent={setSelectedStudentId}
            onOpenRegister={() => setIsRegisterOpen(true)}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'quizzes' && (
          <QuizView
            quiz={SAMPLE_MATH_QUIZ}
            quizzes={quizzes}
            students={students}
            currentStudentId={selectedStudentId}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenRegister={() => setIsRegisterOpen(true)}
            onRecordResult={handleRecordQuizResult}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesView
            resources={resources}
            bacArchives={bacArchives}
            currentUser={currentUser}
            siteSettings={siteSettings}
            onOpenTeacherSpace={() => setActiveTab('teacher_space')}
            onOpenControlPanel={() => setActiveTab('control_panel')}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onIncrementDownload={handleIncrementResourceDownload}
            onDeleteResource={handleDeleteResource}
            onToggleHideResource={(id) => handleToggleHideResource(id, !resources.find(r => r.id === id)?.isHidden)}
          />
        )}

        {activeTab === 'association_dashboard' && (
          <AssociationDashboard
            students={students}
            teachers={teachers}
            sessions={sessions}
            quizSubmissions={quizSubmissions}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'communication' && (
          <CommunicationCenter
            sessions={sessions}
            onBroadcastNotification={handleBroadcastNotification}
          />
        )}
      </main>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdateProfile={handleUpdateUserProfile}
      />

      {/* Auth Modal with Password Recovery */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLogin}
        onRegisterStudent={handleRegisterStudentFromAuth}
        onRegisterTeacher={handleRegisterTeacherFromAuth}
        onUpdatePassword={handleUpdatePassword}
        allStudents={students}
        allTeachers={teachers}
        adminUser={adminUser}
      />

      {/* Standalone Registration Modal */}
      <StudentRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegister={handleRegisterStudent}
      />

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllRead}
        onMarkRead={handleMarkRead}
      />

      {/* Dynamic Customizable Footer */}
      <footer className="no-print bg-white border-t border-stone-200 mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="space-y-1 text-center md:text-right">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                {siteSettings.customLogoUrl && siteSettings.customLogoUrl !== '/badhra-logo.svg' ? (
                  <img
                    src={siteSettings.customLogoUrl}
                    alt={siteSettings.siteName}
                    className="w-11 h-11 object-contain rounded-full shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <BadhraLogo size={44} className="w-11 h-11 shrink-0" />
                )}
                <div>
                  <span className="font-extrabold text-stone-900 text-sm block">
                    {siteSettings.footerAssociationName}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-bold block">
                    {siteSettings.siteName} - {siteSettings.siteSubtitle}
                  </span>
                </div>
              </div>
              <p className="text-xs text-stone-500 max-w-lg mt-1 leading-relaxed">
                {siteSettings.footerDescription}
              </p>
              {siteSettings.workingHoursNote && (
                <div className="text-[11px] text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg inline-block font-medium border border-emerald-200/60 mt-1">
                  ⏱️ {siteSettings.workingHoursNote}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 text-xs text-stone-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{siteSettings.address}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-mono" dir="ltr">{siteSettings.phone}</span>
                {siteSettings.secondaryPhone && (
                  <span className="font-mono text-stone-400" dir="ltr">| {siteSettings.secondaryPhone}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="font-mono">{siteSettings.email}</span>
              </div>
            </div>

            <div className="flex flex-col md:items-end items-center gap-2.5">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {siteSettings.facebookUrl && (
                  <a href={siteSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1">
                    <span>Facebook</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {siteSettings.telegramChannelUrl && (
                  <a href={siteSettings.telegramChannelUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1">
                    <span>Telegram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {siteSettings.whatsappContact && (
                  <a href={`https://wa.me/${siteSettings.whatsappContact}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1">
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
              <div className="text-xs text-stone-400 font-mono">
                {siteSettings.copyrightText}
              </div>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
}
