import React, { useState } from 'react';
import { 
  Teacher, 
  SupportSession, 
  Student, 
  StudyResource, 
  BacStream, 
  AttendanceStatus, 
  AppNotification, 
  AppUser,
  EducationLevel,
  BEM_STREAMS,
  BAC_STREAMS,
  BEM_SUBJECTS,
  BAC_SUBJECTS,
  Quiz
} from '../types';
import { QuizCreatorModal } from './QuizCreatorModal';
import { 
  CalendarPlus, 
  FileUp, 
  UserCheck, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  PlusCircle, 
  MapPin, 
  Users, 
  Award,
  AlertCircle,
  BellRing,
  Bell,
  MessageSquare,
  Lock,
  ShieldAlert,
  LogIn,
  GraduationCap,
  Sparkles,
  HelpCircle,
  Trash2,
  Eye,
  EyeOff,
  FolderCog,
  FileText
} from 'lucide-react';

interface TeacherSpaceProps {
  teachers: Teacher[];
  sessions: SupportSession[];
  students: Student[];
  notifications: AppNotification[];
  loggedInTeacherId?: string;
  currentUser?: AppUser | null;
  onOpenAuth?: () => void;
  onAddSession: (session: SupportSession) => void;
  onUpdateAttendance: (sessionId: string, attendance: Record<string, AttendanceStatus>, notes: string) => void;
  onAddResource: (resource: StudyResource) => void;
  onAddQuiz?: (quiz: Quiz) => void;
  resources?: StudyResource[];
  onDeleteSession?: (sessionId: string) => void;
  onToggleHideSession?: (sessionId: string, isHidden: boolean) => void;
  onDeleteResource?: (resourceId: string) => void;
  onToggleHideResource?: (resourceId: string, isHidden: boolean) => void;
}

const ALL_STREAMS: BacStream[] = [
  'السنة الرابعة متوسط (BEM)',
  'علوم تجريبية',
  'رياضيات',
  'تقني رياضي',
  'تسيير واقتصاد',
  'آداب وفلسفة',
  'لغات أجنبية',
];

export const TeacherSpace: React.FC<TeacherSpaceProps> = ({
  teachers,
  sessions,
  students,
  notifications,
  loggedInTeacherId,
  currentUser,
  onOpenAuth,
  onAddSession,
  onUpdateAttendance,
  onAddResource,
  onAddQuiz,
  resources = [],
  onDeleteSession,
  onToggleHideSession,
  onDeleteResource,
  onToggleHideResource,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState(
    loggedInTeacherId || teachers[0]?.id || ''
  );
  const [activeSection, setActiveSection] = useState<'teacher_alerts' | 'new_session' | 'attendance' | 'upload_resource' | 'manage_content' | 'teachers_list'>('teacher_alerts');
  const [isQuizCreatorOpen, setIsQuizCreatorOpen] = useState(false);

  const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];

  // Only logged-in teachers or association admins are authorized to add sessions
  const canAddSession = currentUser?.role === 'teacher' || currentUser?.role === 'association_admin';

  // Filter notifications specifically for teachers (role === 'teachers' or targetTeacherId)
  const teacherSpecificNotifications = notifications.filter(
    n => n.targetRole === 'teachers' || n.type === 'teacher_alert' || n.targetTeacherId === currentTeacher?.id
  );

  // Attendance management state
  const teacherSessions = sessions.filter(s => s.teacherId === currentTeacher?.id || !currentTeacher);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(teacherSessions[0]?.id || sessions[0]?.id || '');
  const activeSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];
  
  const [currentAttendance, setCurrentAttendance] = useState<Record<string, AttendanceStatus>>(
    activeSession?.attendance || {}
  );
  const [pedagogicalNotes, setPedagogicalNotes] = useState<string>(
    activeSession?.pedagogicalNotes || ''
  );
  const [savedFeedback, setSavedFeedback] = useState(false);

  // New Session Form State (امكانية اضافة حصص وتوقيت)
  const [newLevel, setNewLevel] = useState<EducationLevel>('BAC');
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState(currentTeacher?.subject || 'الرياضيات');
  const [newStream, setNewStream] = useState<BacStream>('علوم تجريبية');
  const [newDate, setNewDate] = useState('2026-10-15');
  const [newTimeText, setNewTimeText] = useState('الخميس 17:30 (بعد صلاة المغرب)');
  const [newLocation, setNewLocation] = useState('دار الشباب الشهيد بوجمعة - القاعة الكبرى');
  const [newDescription, setNewDescription] = useState('');
  const [newAttachedDoc, setNewAttachedDoc] = useState('');
  const [sessionSuccess, setSessionSuccess] = useState(false);

  // Resource Upload Form State
  const [resLevel, setResLevel] = useState<EducationLevel>('BAC');
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState<'summary' | 'exercise' | 'cheatsheet'>('summary');
  const [resStream, setResStream] = useState<BacStream>('علوم تجريبية');
  const [resSubject, setResSubject] = useState(currentTeacher?.subject || 'الرياضيات');
  const [resDesc, setResDesc] = useState('');
  const [resSolution, setResSolution] = useState('');
  const [uploadedPdf, setUploadedPdf] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState('');
  const [resourceSuccess, setResourceSuccess] = useState(false);

  const handleNewLevelChange = (lvl: EducationLevel) => {
    setNewLevel(lvl);
    if (lvl === 'BEM') {
      setNewStream('السنة الرابعة متوسط (BEM)');
      setNewSubject(BEM_SUBJECTS[0]);
    } else {
      setNewStream('علوم تجريبية');
      setNewSubject(currentTeacher?.subject || BAC_SUBJECTS[0]);
    }
  };

  const handleResLevelChange = (lvl: EducationLevel) => {
    setResLevel(lvl);
    if (lvl === 'BEM') {
      setResStream('السنة الرابعة متوسط (BEM)');
      setResSubject(BEM_SUBJECTS[0]);
    } else {
      setResStream('علوم تجريبية');
      setResSubject(currentTeacher?.subject || BAC_SUBJECTS[0]);
    }
  };

  // Handle PDF file upload for teachers
  const handlePdfFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setPdfUploadError('يرجى اختيار ملف بصيغة PDF فقط');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setPdfUploadError('حجم الملف يتجاوز 25 ميغابايت، يرجى اختيار ملف أصغر');
      return;
    }

    setPdfUploadError('');
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadedPdf({
        name: file.name,
        size: sizeInMb,
        dataUrl,
      });
      if (!resTitle.trim()) {
        setResTitle(file.name.replace(/\.pdf$/i, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  // Switch session attendance records when active session changes
  const handleSelectSession = (id: string) => {
    setSelectedSessionId(id);
    const ses = sessions.find(s => s.id === id);
    if (ses) {
      setCurrentAttendance(ses.attendance || {});
      setPedagogicalNotes(ses.pedagogicalNotes || '');
    }
  };

  const handleToggleAttendance = (studentId: string, status: AttendanceStatus) => {
    setCurrentAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = () => {
    if (!activeSession) return;
    onUpdateAttendance(activeSession.id, currentAttendance, pedagogicalNotes);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const sessionObj: SupportSession = {
      id: `ses-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      subject: newSubject,
      stream: newStream,
      educationLevel: newLevel,
      teacherId: currentTeacher.id,
      teacherName: currentTeacher.fullName,
      date: newDate,
      timeText: newTimeText.trim(),
      location: newLocation.trim(),
      description: newDescription.trim() || 'حصة دعم ومراجعة مكثفة.',
      completed: false,
      attendance: {},
      attachedResourceTitle: newAttachedDoc.trim() || undefined,
    };

    onAddSession(sessionObj);
    setSessionSuccess(true);
    setNewTitle('');
    setNewDescription('');
    setTimeout(() => {
      setSessionSuccess(false);
      setActiveSection('attendance');
    }, 1500);
  };

  const handleUploadResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim()) return;

    const resourceObj: StudyResource = {
      id: `res-${Date.now().toString().slice(-4)}`,
      title: resTitle.trim(),
      subject: resSubject,
      stream: resStream,
      educationLevel: resLevel,
      type: resType,
      teacherName: currentTeacher.fullName,
      uploadDate: new Date().toISOString().split('T')[0],
      downloadCount: 0,
      fileSize: uploadedPdf?.size || '2.8 MB',
      description: resDesc.trim() || (resLevel === 'BEM' ? 'ملخص وتمارين موجهة للتحضير لشهادة التعليم المتوسط BEM 2027.' : 'ملخص وتمارين موجهة للتحضير لبكالوريا 2027.'),
      contentPreview: uploadedPdf ? `تم إرفاق ملف PDF أصلي بعنوان: ${uploadedPdf.name}` : (resDesc.trim() || 'محتوى بيداغوجي رقمي معتمد من الأستاذ المؤطر.'),
      hasSolution: !!resSolution.trim(),
      solutionText: resSolution.trim() || undefined,
      pdfDataUrl: uploadedPdf?.dataUrl,
      pdfFileName: uploadedPdf?.name || `${resTitle.trim()}.pdf`,
    };

    onAddResource(resourceObj);
    setResourceSuccess(true);
    setResTitle('');
    setResDesc('');
    setResSolution('');
    setUploadedPdf(null);
    setPdfUploadError('');
    setTimeout(() => {
      setResourceSuccess(false);
    }, 1500);
  };

  // Security Guard: Strictly protect Teacher Space against student access
  if (currentUser?.role === 'student') {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-3xl border border-stone-200 text-center shadow-xs text-stone-800">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-stone-900 text-base mb-1.5">فضاء خاص بالأساتذة المؤطرين والإدارة</h3>
        <p className="text-stone-600 text-xs mb-4 leading-relaxed">
          عذراً، هذا الفضاء مخصص حصرياً للأساتذة المتطوعين وإدارة الجمعية لإدارة الحصص ورصد الغياب ونشر المذكرات.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Top Banner: Teacher Identity & Volunteer hours */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {currentTeacher?.avatarUrl || (currentUser?.role === 'teacher' && currentUser.avatarUrl) ? (
            <img
              src={currentTeacher?.avatarUrl || currentUser?.avatarUrl}
              alt={currentTeacher?.fullName}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center text-xl font-bold shadow-xs">
              {currentTeacher?.fullName.slice(3, 5) || 'أ'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
                فضاء الأستاذ المتطوع
              </h1>
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">
                أستاذ مؤطر
              </span>
            </div>
            <div className="text-xs text-stone-500 mt-1 flex flex-wrap items-center gap-2">
              <span>الأستاذ: <b className="text-stone-800">{currentTeacher?.fullName}</b></span>
              <span aria-hidden="true">·</span>
              <span>المادة: <b className="text-emerald-700">{currentTeacher?.subject}</b></span>
              <span aria-hidden="true">·</span>
              <span>اسم المستخدم: <b className="font-mono text-stone-700">{currentTeacher?.username || '–'}</b></span>
              <span aria-hidden="true">·</span>
              <span>الهاتف: <b className="font-mono text-stone-700" dir="ltr">{currentTeacher?.phone}</b></span>
            </div>
          </div>
        </div>

        {/* Volunteer Hours Stat and Switcher */}
        <div className="flex items-center gap-4">
          <div className="text-left bg-stone-50 border border-stone-200 px-4 py-2 rounded-xl">
            <span className="text-[11px] text-stone-500 block">ساعات التطوع المنجزة:</span>
            <div className="flex items-center gap-1 font-mono font-bold text-lg text-emerald-800">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>{currentTeacher?.volunteerHours} ساعة</span>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-stone-400 block mb-1">تبديل حساب الأستاذ:</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                setSelectedTeacherId(e.target.value);
                const t = teachers.find(tch => tch.id === e.target.value);
                if (t) {
                  setNewSubject(t.subject);
                  setResSubject(t.subject);
                }
              }}
              className="text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 focus:outline-hidden"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.fullName} ({t.subject})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Quick Action Pills for Easy Finger Tap */}
      <div className="md:hidden grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setActiveSection('new_session')}
          className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border ${
            activeSection === 'new_session'
              ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}
        >
          <CalendarPlus className="w-4 h-4 text-amber-400" />
          <span>+ إضافة حصة دعم</span>
        </button>

        <button
          onClick={() => setActiveSection('attendance')}
          className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border ${
            activeSection === 'attendance'
              ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
              : 'bg-stone-50 text-stone-800 border-stone-200'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-700" />
          <span>رصد الحضور</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-3 mb-6 overflow-x-auto no-scrollbar scroll-smooth">
        <button
          onClick={() => setActiveSection('teacher_alerts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSection === 'teacher_alerts'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>إشعارات وتنبيهات ({teacherSpecificNotifications.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('new_session')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSection === 'new_session'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <CalendarPlus className="w-4 h-4" />
          <span>إدخال حصة دعم وتحديد التوقيت</span>
        </button>

        <button
          onClick={() => setActiveSection('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSection === 'attendance'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>تسجيل الحضور والملاحظات</span>
        </button>

        <button
          onClick={() => setActiveSection('upload_resource')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSection === 'upload_resource'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>رفع ملخص أو تمارين</span>
        </button>

        <button
          onClick={() => setActiveSection('manage_content')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSection === 'manage_content'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <FolderCog className="w-4 h-4" />
          <span>إدارة حصصي وملفاتي (حذف / إخفاء)</span>
        </button>

        <button
          onClick={() => setActiveSection('teachers_list')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 ${
            activeSection === 'teachers_list'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>دليل الأساتذة المتطوعين</span>
        </button>

        <button
          onClick={() => setIsQuizCreatorOpen(true)}
          className="mr-auto px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white shadow-xs"
        >
          <HelpCircle className="w-4 h-4 text-amber-300" />
          <span>تصميم ونشر اختبار MCQ (BAC / BEM)</span>
        </button>
      </div>

      {/* Tab 1: Teacher Notifications (إشعارات الأساتذة) */}
      {activeSection === 'teacher_alerts' && (
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">صندوق إشعارات وتنبيهات الأستاذ</h3>
              <p className="text-emerald-800">التنبيهات الموجهة لك من إدارة الجمعية بشأن القاعات والمواعيد وحضور التلاميذ.</p>
            </div>
            <Bell className="w-6 h-6 text-emerald-700" />
          </div>

          {teacherSpecificNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
              لا توجد تنبيهات جديدة لك حالياً.
            </div>
          ) : (
            teacherSpecificNotifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 flex items-center gap-1.5 text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    {notif.title}
                  </span>
                  <span className="font-mono text-stone-400 text-[10px]">{notif.date}</span>
                </div>

                <p className="text-stone-700 leading-relaxed font-medium">
                  {notif.message}
                </p>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>مرسل من: <b>إدارة جمعية بذرة غد</b></span>
                  <span className="text-emerald-700 font-semibold">● إشعار مؤكد</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Add New Support Session & Timing (امكانية اضافة حصص وتوقيت - محصورة للأستاذ والمدير فقط) */}
      {activeSection === 'new_session' && (
        !canAddSession ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 max-w-xl mx-auto shadow-xs text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <span className="text-[11px] bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-md font-mono">
                صلاحيات محدودة 🔒
              </span>
              <h3 className="text-base font-extrabold text-stone-900 mt-2">
                برمجة الحصص مخصصة للأساتذة المسجلين والإدارة فقط
              </h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                لا يمكن لأي زائر أو تلميذ إضافة حصص في البرنامج. يرجى تسجيل الدخول بحسابك كأستاذ متطوع أو كإدارة الجمعية لإضافة وتعديل جدول الحصص.
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <LogIn className="w-4 h-4" />
                <span>دخول كأستاذ أو إدارة الجمعية</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-2xl mx-auto shadow-xs">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <CalendarPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900">برمجة حصة دعم جديدة وتحديد التوقيت</h2>
                <p className="text-xs text-stone-500">حدد تاريخ وتوقيت الحصة والمادة والشعبة بدار الشباب (تُنشر تلقائياً على التيليجرام)</p>
              </div>
            </div>

            {sessionSuccess ? (
              <div className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h3 className="font-bold text-stone-900 text-sm">تم إدراج الحصة في البرنامج وبثها للتليجرام بنجاح!</h3>
                <p className="text-xs text-stone-500 mt-1">سيتم إشعار التلاميذ المعنيين في الشعبة فوراً.</p>
              </div>
            ) : (
            <form onSubmit={handleCreateSession} className="space-y-4">
              {/* Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  الطور التعليمي المستهدف <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleNewLevelChange('BAC')}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2 ${
                      newLevel === 'BAC'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <GraduationCap className={`w-4 h-4 shrink-0 ${newLevel === 'BAC' ? 'text-amber-300' : 'text-emerald-700'}`} />
                    <div>
                      <div className="font-extrabold text-xs">شهادة البكالوريا (BAC)</div>
                      <div className={`text-[10px] ${newLevel === 'BAC' ? 'text-emerald-100' : 'text-stone-500'}`}>3 ثانوي - جميع الشعب</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNewLevelChange('BEM')}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2 ${
                      newLevel === 'BEM'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <BookOpen className={`w-4 h-4 shrink-0 ${newLevel === 'BEM' ? 'text-white' : 'text-amber-600'}`} />
                    <div>
                      <div className="font-extrabold text-xs">شهادة التعليم المتوسط (BEM)</div>
                      <div className={`text-[10px] ${newLevel === 'BEM' ? 'text-amber-100' : 'text-stone-500'}`}>السنة الرابعة متوسط</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  عنوان الحصة / موضوع الدرس <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={newLevel === 'BEM' ? 'مثال: مراجعة شاملة لنظرية طالس والنسب المثلثية' : 'مثال: حل مسألة شاملة في الدوال اللوغاريتمية والمناقشة البيانية'}
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    المادة <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  >
                    {(newLevel === 'BEM' ? BEM_SUBJECTS : BAC_SUBJECTS).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {newLevel === 'BEM' ? 'المستوى' : 'الشعبة المستهدفة'} <span className="text-rose-500">*</span>
                  </label>
                  {newLevel === 'BEM' ? (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900">
                      السنة الرابعة متوسط (BEM)
                    </div>
                  ) : (
                    <select
                      value={newStream}
                      onChange={(e) => setNewStream(e.target.value as BacStream)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                    >
                      {BAC_STREAMS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    التاريخ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    التوقيت المقترح <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTimeText}
                    onChange={(e) => setNewTimeText(e.target.value)}
                    placeholder="مثال: الخميس 17:30 (بعد صلاة المغرب)"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  المقر / القاعة بدار الشباب <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="دار الشباب الشهيد بوجمعة - القاعة الكبرى"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  وصف الحصة والأهداف التعليمية:
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="ملخص لما سيتم التطرق له خلال الحصة..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  تأكيد إدراج الحصة
                </button>
              </div>
            </form>
          )}
        </div>
        )
      )}

      {/* Tab 3: Attendance & Pedagogical Notes */}
      {activeSection === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-stone-700">اختر الحصة المبرمجة:</label>
              <select
                value={selectedSessionId}
                onChange={(e) => handleSelectSession(e.target.value)}
                className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg font-medium text-stone-900"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.timeText}) - {s.stream}
                  </option>
                ))}
              </select>
            </div>

            {activeSession && (
              <div className="text-xs text-stone-500 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  <span>{activeSession.location}</span>
                </span>
                <span>الشعبة: <b className="text-stone-800">{activeSession.stream}</b></span>
              </div>
            )}
          </div>

          {/* Student Roster Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">قائمة التلاميذ المسجلين في هذه الشعبة</h3>
                <p className="text-xs text-stone-500">حدد حالة الحضور بنقرة واحدة (حاضر / غائب / متأخر)</p>
              </div>

              <div className="flex items-center gap-2">
                {savedFeedback && (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle className="w-4 h-4" />
                    تم حفظ الحضور بنجاح!
                  </span>
                )}
                <button
                  onClick={handleSaveAttendance}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  حفظ الحضور والملاحظات
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">التلميذ</th>
                    <th className="py-3 px-4">الشعبة</th>
                    <th className="py-3 px-4">هاتف الولي</th>
                    <th className="py-3 px-4">نسبة الحضور العامة</th>
                    <th className="py-3 px-4 text-center">تسجيل حالة الحضور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {students.map((student) => {
                    const status = currentAttendance[student.id] || 'present';
                    return (
                      <tr key={student.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-stone-900">
                          {student.fullName}
                          <span className="block text-[11px] font-normal text-stone-500">
                            {student.highSchool}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-stone-700">{student.stream}</td>
                        <td className="py-3 px-4 font-mono text-stone-600" dir="ltr">
                          {student.parentPhone}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold">
                          <span className={student.attendanceRate >= 85 ? 'text-emerald-700' : 'text-amber-600'}>
                            {student.attendanceRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex p-1 bg-stone-100 rounded-lg gap-1">
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(student.id, 'present')}
                              className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                                status === 'present'
                                  ? 'bg-emerald-700 text-white shadow-xs'
                                  : 'text-stone-600 hover:text-stone-900'
                              }`}
                            >
                              حاضر
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(student.id, 'late')}
                              className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                                status === 'late'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-stone-600 hover:text-stone-900'
                              }`}
                            >
                              متأخر
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleAttendance(student.id, 'absent')}
                              className={`px-3 py-1 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                                status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'text-stone-600 hover:text-stone-900'
                              }`}
                            >
                              غائب
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-stone-50/50 border-t border-stone-200">
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                ملاحظات الأستاذ البيداغوجية حول مستوى التلاميذ وتوصيات الحصة:
              </label>
              <textarea
                value={pedagogicalNotes}
                onChange={(e) => setPedagogicalNotes(e.target.value)}
                placeholder="مثال: استيعاب جيد لمبرهنة القيم المتوسطة، لوحظ تردد بعض التلاميذ في حساب المشتقة المركبة..."
                rows={3}
                className="w-full p-3 text-xs bg-white border border-stone-200 rounded-xl focus:outline-hidden focus:border-emerald-600 text-stone-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Upload Resource */}
      {activeSection === 'upload_resource' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 max-w-2xl mx-auto shadow-xs">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900">نشر ملخص أو تمارين</h2>
              <p className="text-xs text-stone-500">تزويد التلاميذ بالملفات التعليمية وحلولها النموذجية</p>
            </div>
          </div>

          {resourceSuccess ? (
            <div className="py-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              <h3 className="font-bold text-stone-900 text-sm">تم نشر الملخص في مكتبة البكالوريا بنجاح!</h3>
            </div>
          ) : (
            <form onSubmit={handleUploadResource} className="space-y-4">
              {/* PDF File Upload Field */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-300 space-y-2">
                <label className="block text-xs font-bold text-emerald-950">
                  ملف الـ PDF المراد رفعه (ملخص أو تمارين محلولة):
                </label>

                {uploadedPdf ? (
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-300 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-stone-900 block truncate">
                          {uploadedPdf.name}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                          {uploadedPdf.size} — ملف جاهز للنشر والتحميل
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedPdf(null)}
                      className="text-stone-400 hover:text-rose-600 text-xs font-bold px-2 py-1 rounded-lg border border-stone-200 hover:border-rose-300 shrink-0 cursor-pointer"
                    >
                      تغيير
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="flex flex-col items-center justify-center p-5 bg-white border border-stone-200 hover:border-emerald-500 rounded-xl cursor-pointer transition-colors text-center group">
                      <FileUp className="w-7 h-7 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-stone-900">
                        انقر هنا لاختيار ملف PDF من حاسوبك أو هاتفك
                      </span>
                      <span className="text-[11px] text-stone-500 mt-0.5">
                        صيغة PDF فقط (حجم أقصى 25 ميغابايت)
                      </span>
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handlePdfFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {pdfUploadError && (
                  <p className="text-xs text-rose-600 font-semibold">{pdfUploadError}</p>
                )}
              </div>

              {/* Resource Level Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  المستوى الدراسي للملف التربوي <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleResLevelChange('BAC')}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2 ${
                      resLevel === 'BAC'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <GraduationCap className={`w-4 h-4 shrink-0 ${resLevel === 'BAC' ? 'text-amber-300' : 'text-emerald-700'}`} />
                    <div>
                      <div className="font-extrabold text-xs">شهادة البكالوريا (BAC)</div>
                      <div className={`text-[10px] ${resLevel === 'BAC' ? 'text-emerald-100' : 'text-stone-500'}`}>3 ثانوي - جميع الشعب</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResLevelChange('BEM')}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2 ${
                      resLevel === 'BEM'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <BookOpen className={`w-4 h-4 shrink-0 ${resLevel === 'BEM' ? 'text-white' : 'text-amber-600'}`} />
                    <div>
                      <div className="font-extrabold text-xs">شهادة التعليم المتوسط (BEM)</div>
                      <div className={`text-[10px] ${resLevel === 'BEM' ? 'text-amber-100' : 'text-stone-500'}`}>السنة الرابعة متوسط</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  عنوان الملف / السلسلة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  placeholder={resLevel === 'BEM' ? 'مثال: سلسلة تمارين شاملة في الجذور التربيعية وحساب PGCD مع الحلول' : 'مثال: ملخص شامل لقوانين الظواهر الكهربائية RC و RL'}
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    نوع المورد
                  </label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                  >
                    <option value="summary">ملخص درس ومفاهيم</option>
                    <option value="exercise">سلسلة تمارين وتطبيقات</option>
                    <option value="cheatsheet">بطاقة تذكر سريع</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    المادة
                  </label>
                  <select
                    value={resSubject}
                    onChange={(e) => setResSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                  >
                    {(resLevel === 'BEM' ? BEM_SUBJECTS : BAC_SUBJECTS).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    {resLevel === 'BEM' ? 'المستوى' : 'الشعبة'}
                  </label>
                  {resLevel === 'BEM' ? (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900">
                      السنة الرابعة متوسط (BEM)
                    </div>
                  ) : (
                    <select
                      value={resStream}
                      onChange={(e) => setResStream(e.target.value as BacStream)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                    >
                      {BAC_STREAMS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  وصف محتوى الملف:
                </label>
                <textarea
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  rows={2}
                  placeholder="وصف مختصر..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  الحل النموذجي المرفق (اختياري):
                </label>
                <textarea
                  value={resSolution}
                  onChange={(e) => setResSolution(e.target.value)}
                  rows={2}
                  placeholder="أدخل الحل النموذجي..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  نشر الملف في المنصة
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Tab: Manage Content (الحصص والملفات: حذف وإخفاء) */}
      {activeSection === 'manage_content' && (
        <div className="space-y-8">
          {/* Header alert */}
          <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">إدارة الحصص والملفات (خاص بالأساتذة المؤطرين والإدارة)</h3>
              <p className="text-emerald-800">يمكنك هنا مراجعة الحصص والمذكرات المبرمجة باسمك، مع إمكانية إخفائها مؤقتاً عن التلاميذ أو حذفها نهائياً.</p>
            </div>
            <FolderCog className="w-6 h-6 text-emerald-700 shrink-0" />
          </div>

          {/* Section 1: Sessions Management */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CalendarPlus className="w-5 h-5 text-emerald-700" />
                <h4 className="font-bold text-stone-900 text-sm">
                  الحصص المبرمجة ({sessions.filter(s => currentUser?.role === 'association_admin' || s.teacherId === currentTeacher?.id).length})
                </h4>
              </div>
              <button
                onClick={() => setActiveSection('new_session')}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                + برمجة حصة جديدة
              </button>
            </div>

            <div className="space-y-3">
              {sessions.filter(s => currentUser?.role === 'association_admin' || s.teacherId === currentTeacher?.id).length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  لا توجد حصص مبرمجة باسمك حالياً.
                </div>
              ) : (
                sessions.filter(s => currentUser?.role === 'association_admin' || s.teacherId === currentTeacher?.id).map(session => (
                  <div key={session.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-800 text-xs">{session.subject}</span>
                        <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-medium">{session.stream}</span>
                        {session.isHidden && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold border border-amber-300">
                            مخفية عن التلاميذ 🔒
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-stone-900 text-xs">{session.title}</h5>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                        <span>⏰ {session.timeText}</span>
                        <span>📍 {session.location}</span>
                        <span>تاريخ: {session.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {onToggleHideSession && (
                        <button
                          type="button"
                          onClick={() => onToggleHideSession(session.id, !session.isHidden)}
                          title={session.isHidden ? 'إظهار الحصة' : 'إخفاء الحصة مؤقتاً'}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            session.isHidden
                              ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {session.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{session.isHidden ? 'إلغاء الإخفاء' : 'إخفاء'}</span>
                        </button>
                      )}

                      {onDeleteSession && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف حصة «${session.title}»؟`)) {
                              onDeleteSession(session.id);
                            }
                          }}
                          title="حذف الحصة نهائياً"
                          className="px-3 py-1.5 bg-white border border-stone-200 hover:border-rose-300 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 2: Files / Resources Management */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <h4 className="font-bold text-stone-900 text-sm">
                  المذكرات والملفات المنشورة ({resources.filter(r => currentUser?.role === 'association_admin' || r.teacherName === currentTeacher?.fullName).length})
                </h4>
              </div>
              <button
                onClick={() => setActiveSection('upload_resource')}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                + رفع ملف جديد
              </button>
            </div>

            <div className="space-y-3">
              {resources.filter(r => currentUser?.role === 'association_admin' || r.teacherName === currentTeacher?.fullName).length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  لم تقم بنشر أي ملفات PDF حتى الآن.
                </div>
              ) : (
                resources.filter(r => currentUser?.role === 'association_admin' || r.teacherName === currentTeacher?.fullName).map(res => (
                  <div key={res.id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-800 text-xs">{res.subject}</span>
                        <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-medium">{res.stream}</span>
                        <span className="text-[10px] font-mono text-stone-400">{res.fileSize}</span>
                        {res.isHidden && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold border border-amber-300">
                            مخفي بالمكتبة 🔒
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-stone-900 text-xs">{res.title}</h5>
                      <div className="text-[11px] text-stone-500">
                        <span>مرات التحميل: <b>{res.downloadCount || 0}</b></span>
                        <span className="mr-3">تاريخ النشر: {res.uploadDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {onToggleHideResource && (
                        <button
                          type="button"
                          onClick={() => onToggleHideResource(res.id, !res.isHidden)}
                          title={res.isHidden ? 'إظهار الملف بالمكتبة' : 'إخفاء الملف مؤقتاً'}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                            res.isHidden
                              ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                          }`}
                        >
                          {res.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span>{res.isHidden ? 'إلغاء الإخفاء' : 'إخفاء'}</span>
                        </button>
                      )}

                      {onDeleteResource && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف ملف «${res.title}»؟`)) {
                              onDeleteResource(res.id);
                            }
                          }}
                          title="حذف الملف نهائياً"
                          className="px-3 py-1.5 bg-white border border-stone-200 hover:border-rose-300 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Teachers Directory */}
      {activeSection === 'teachers_list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-3">
                  {teacher.avatarUrl ? (
                    <img
                      src={teacher.avatarUrl}
                      alt={teacher.fullName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400 shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center font-bold text-emerald-800 text-base">
                      {teacher.fullName.slice(3, 5)}
                    </div>
                  )}
                  <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-md">
                    {teacher.subject}
                  </span>
                </div>

                <h3 className="font-bold text-stone-900 text-sm">{teacher.fullName}</h3>
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">{teacher.bio}</p>

                <div className="mt-4 pt-3 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
                  <div className="flex items-center justify-between">
                    <span>مركز التطوع:</span>
                    <span className="font-semibold text-stone-800">{teacher.centerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ساعات التطوع:</span>
                    <span className="font-mono font-bold text-emerald-700">{teacher.volunteerHours} ساعة</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quiz Creator Modal */}
      <QuizCreatorModal
        isOpen={isQuizCreatorOpen}
        onClose={() => setIsQuizCreatorOpen(false)}
        currentUser={currentUser || null}
        onPublishQuiz={(newQuiz) => {
          if (onAddQuiz) {
            onAddQuiz(newQuiz);
          }
          setIsQuizCreatorOpen(false);
        }}
      />

    </div>
  );
};
