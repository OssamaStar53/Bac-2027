import React, { useState } from 'react';
import { AppUser, BacStream, Student, Teacher, UserRole, EducationLevel, BAC_STREAMS, BEM_STREAMS } from '../types';
import { BadhraLogo } from './BadhraLogo';
import { api } from '../api';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Lock, 
  Phone, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  GraduationCap, 
  School,
  Eye,
  EyeOff,
  KeyRound,
  RotateCcw,
  Sparkles,
  Mail,
  Send,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  BookOpen
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onLogin: (user: AppUser) => void;
  onRegisterStudent: (student: Student, user: AppUser) => void;
  onRegisterTeacher: (teacher: Teacher, user: AppUser) => void;
  onUpdatePassword?: (role: UserRole, relatedId: string, newPass: string) => void;
  allStudents: Student[];
  allTeachers: Teacher[];
  adminUser?: AppUser;
}

const ALL_STREAMS: BacStream[] = [
  'علوم تجريبية',
  'رياضيات',
  'تقني رياضي',
  'تسيير واقتصاد',
  'آداب وفلسفة',
  'لغات أجنبية',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onRegisterStudent,
  onRegisterTeacher,
  onUpdatePassword,
  allStudents,
  allTeachers,
  adminUser,
}) => {
  const [mode, setMode] = useState<'login' | 'register_student' | 'register_teacher' | 'forgot_password'>('login');
  
  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState(''); // username or phone
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Advanced Email Recovery State
  const [recoveryEmailOrUser, setRecoveryEmailOrUser] = useState('');
  const [recoveryMethod, setRecoveryMethod] = useState<'code_and_link' | 'temp_password'>('code_and_link');
  const [recoveryStage, setRecoveryStage] = useState<'input' | 'sent' | 'resetting' | 'done'>('input');
  const [dispatchedEmailData, setDispatchedEmailData] = useState<{
    targetEmail: string;
    accountName: string;
    role: string;
    otpCode: string;
    resetToken: string;
    resetUrl: string;
    tempPassword?: string;
  } | null>(null);

  const [inputOtpCode, setInputOtpCode] = useState('');
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [copiedCodeNotice, setCopiedCodeNotice] = useState(false);

  // Student Register State
  const [stdFullName, setStdFullName] = useState('');
  const [stdUsername, setStdUsername] = useState('');
  const [stdPhone, setStdPhone] = useState('');
  const [stdParentPhone, setStdParentPhone] = useState('');
  const [stdPassword, setStdPassword] = useState('');
  const [stdStream, setStdStream] = useState<BacStream>('علوم تجريبية');
  const [stdSchool, setStdSchool] = useState('');
  const [stdWilaya, setStdWilaya] = useState('الجزائر - براقي');
  const [stdSubjects, setStdSubjects] = useState<string[]>(['الرياضيات', 'العلوم الفيزيائية']);

  // Teacher Register State
  const [tchFullName, setTchFullName] = useState('');
  const [tchUsername, setTchUsername] = useState('');
  const [tchPhone, setTchPhone] = useState('');
  const [tchPassword, setTchPassword] = useState('');
  const [tchSubject, setTchSubject] = useState('الرياضيات');
  const [tchCenter, setTchCenter] = useState('دار الشباب الشهيد بوجمعة');
  const [tchBio, setTchBio] = useState('');

  const [regError, setRegError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  // Handle Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const query = loginIdentifier.trim().toLowerCase();
    const pwd = loginPassword.trim();

    if (!query || !pwd) {
      setLoginError('يرجى إدخال اسم المستخدم أو رقم الهاتف وكلمة السر');
      return;
    }

    const setPersistentState = () => {
      if (rememberMe) {
        localStorage.setItem('badhra_remember_me', 'true');
        localStorage.setItem('badhra_session_persistent', 'true');
      } else {
        localStorage.removeItem('badhra_remember_me');
        localStorage.removeItem('badhra_session_persistent');
      }
    };

    // Attempt Server Login First for Multi-device Authentication
    const serverResult = await api.login(query, pwd);
    if (serverResult.user) {
      setPersistentState();
      onLogin(serverResult.user);
      setSuccessNotice(`مرحباً بك! تم تسجيل الدخول بنجاح كـ ${serverResult.user.fullName}`);
      setTimeout(() => {
        setSuccessNotice('');
        onClose();
      }, 900);
      return;
    }

    // Local fallback check
    const currentAdminUser = adminUser || {
      id: 'usr-admin-01',
      role: 'association_admin' as UserRole,
      username: 'admin',
      phone: '0550000000',
      password: 'admin',
      fullName: 'إدارة جمعية بذرة غد',
      relatedId: 'admin',
    };

    // Check Admin
    if (
      (query === currentAdminUser.username.toLowerCase() || query === currentAdminUser.phone) &&
      (pwd === currentAdminUser.password)
    ) {
      setPersistentState();
      onLogin(currentAdminUser);
      setSuccessNotice('مرحباً بك! تم تسجيل الدخول كإدارة الجمعية');
      setTimeout(() => {
        setSuccessNotice('');
        onClose();
      }, 900);
      return;
    }

    // Check Teacher
    const matchedTeacher = allTeachers.find(
      (t) =>
        (t.username?.toLowerCase() === query || t.phone === query || t.email?.toLowerCase() === query) &&
        (t.password === pwd)
    );

    if (matchedTeacher) {
      setPersistentState();
      const teacherUser: AppUser = {
        id: `usr-${matchedTeacher.id}`,
        role: 'teacher',
        username: matchedTeacher.username || matchedTeacher.fullName,
        phone: matchedTeacher.phone,
        password: pwd,
        fullName: matchedTeacher.fullName,
        relatedId: matchedTeacher.id,
        subject: matchedTeacher.subject,
      };
      onLogin(teacherUser);
      setSuccessNotice(`مرحباً بالأستاذ ${matchedTeacher.fullName}`);
      setTimeout(() => {
        setSuccessNotice('');
        onClose();
      }, 900);
      return;
    }

    // Check Student
    const matchedStudent = allStudents.find(
      (s) =>
        (s.username?.toLowerCase() === query || s.phone === query) &&
        (s.password === pwd)
    );

    if (matchedStudent) {
      setPersistentState();
      const studentUser: AppUser = {
        id: `usr-${matchedStudent.id}`,
        role: 'student',
        username: matchedStudent.username || matchedStudent.fullName,
        phone: matchedStudent.phone,
        password: pwd,
        fullName: matchedStudent.fullName,
        relatedId: matchedStudent.id,
        stream: matchedStudent.stream,
        wilaya: matchedStudent.wilaya,
      };
      onLogin(studentUser);
      setSuccessNotice(`أهلاً بك يا ${matchedStudent.fullName} في فضاء التلميذ`);
      setTimeout(() => {
        setSuccessNotice('');
        onClose();
      }, 900);
      return;
    }

    setLoginError('بيانات الدخول غير صحيحة. تأكد من اسم المستخدم أو رقم الهاتف وكلمة السر، أو استخدم خيار استرجاع كلمة السر بالبريد بالأسفل.');
  };

  // Quick Demo Login for Student or Teacher (Admin demo is completely removed for security!)
  const handleQuickDemo = (type: 'student' | 'teacher') => {
    if (type === 'teacher') {
      setLoginIdentifier('benaissa');
      setLoginPassword('123456');
      setSelectedRole('teacher');
    } else {
      setLoginIdentifier('yassine');
      setLoginPassword('123456');
      setSelectedRole('student');
    }
  };

  // Handle Requesting Password Recovery via Email
  const handleRequestPasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    const targetInput = recoveryEmailOrUser.trim();
    if (!targetInput) {
      setRecoveryError('يرجى إدخال البريد الإلكتروني أو اسم المستخدم المسجل');
      return;
    }

    // Call API /api/auth/forgot-password
    const res = await api.forgotPassword(
      targetInput, 
      recoveryMethod === 'temp_password' ? 'send_temp_password' : 'send_code_and_link'
    );

    if (!res.success) {
      setRecoveryError(res.error || 'تعذر العثور على حساب بهذا البريد.');
      return;
    }

    setDispatchedEmailData({
      targetEmail: res.targetEmail,
      accountName: res.accountName,
      role: res.role,
      otpCode: res.otpCode,
      resetToken: res.resetToken,
      resetUrl: res.resetUrl,
      tempPassword: res.tempPassword,
    });

    if (recoveryMethod === 'temp_password') {
      setRecoveryStage('done');
      setRecoverySuccess(`تم توليد كلمة سر جديدة وإرسالها إلى البريد الإلكتروني (${res.targetEmail})`);
    } else {
      setRecoveryStage('sent');
      setRecoverySuccess(`تم إرسال رمز التحقق ورابط الاسترجاع إلى البريد الإلكتروني (${res.targetEmail})`);
    }
  };

  // Handle Validating OTP Code
  const handleVerifyOtpAndProceed = () => {
    if (!dispatchedEmailData) return;
    if (inputOtpCode.trim() !== dispatchedEmailData.otpCode) {
      setRecoveryError('رمز التحقق (OTP) غير صحيح. يرجى مراجعة البريد الإلكتروني المستلم وإدخال الرمز المكون من 6 أرقام.');
      return;
    }
    setRecoveryError('');
    setRecoveryStage('resetting');
  };

  // Handle Submitting New Password
  const handleConfirmNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');

    if (!newPasswordVal.trim() || newPasswordVal.length < 4) {
      setRecoveryError('يرجى إدخال كلمة سر جديدة لا تقل عن 4 خانات');
      return;
    }
    if (newPasswordVal !== confirmPasswordVal) {
      setRecoveryError('كلمتا السر الجديدتان غير متطابقتين');
      return;
    }

    if (dispatchedEmailData) {
      // Update on server
      await api.resetPassword(dispatchedEmailData.otpCode, newPasswordVal.trim(), dispatchedEmailData.resetToken);

      // Update in client state
      if (onUpdatePassword) {
        onUpdatePassword(
          dispatchedEmailData.role as UserRole,
          dispatchedEmailData.role === 'association_admin' ? 'admin' : dispatchedEmailData.accountName,
          newPasswordVal.trim()
        );
      }

      setRecoveryStage('done');
      setRecoverySuccess('تم تعيين كلمة السر الجديدة بنجاح في قاعدة البيانات المركزية! يمكنك الآن الدخول بها.');
    }
  };

  // Student Registration
  const handleStudentRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!stdFullName.trim() || !stdPhone.trim() || !stdPassword.trim()) {
      setRegError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    const newStudentId = `std-${Date.now().toString().slice(-4)}`;
    const studentUser: AppUser = {
      id: `usr-${newStudentId}`,
      role: 'student',
      username: stdUsername.trim() || `std_${stdPhone.slice(-4)}`,
      phone: stdPhone.trim(),
      password: stdPassword.trim(),
      fullName: stdFullName.trim(),
      relatedId: newStudentId,
      stream: stdStream,
      wilaya: stdWilaya,
    };

    const newStudent: Student = {
      id: newStudentId,
      fullName: stdFullName.trim(),
      username: studentUser.username,
      password: stdPassword.trim(),
      stream: stdStream,
      phone: stdPhone.trim(),
      parentPhone: stdParentPhone.trim() || stdPhone.trim(),
      wilaya: stdWilaya,
      highSchool: stdSchool.trim() || 'ثانوية معتمدة',
      enrolledSubjects: stdSubjects,
      attendanceRate: 100,
      averageScore: 12.0,
      weaknesses: [],
      strengths: [stdSubjects[0] || 'المواد العلمية'],
      monthlyProgression: [
        { month: 'أكتوبر 2026', attendance: 100, score: 12.0 },
      ],
      registrationDate: new Date().toISOString().split('T')[0],
      avatarSeed: studentUser.username,
    };

    await api.registerStudent(newStudent);
    onRegisterStudent(newStudent, studentUser);
    onClose();
  };

  // Teacher Registration
  const handleTeacherRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!tchFullName.trim() || !tchPhone.trim() || !tchPassword.trim()) {
      setRegError('يرجى إكمال بيانات الأستاذ');
      return;
    }

    const newTeacherId = `tch-${Date.now().toString().slice(-4)}`;
    const teacherUser: AppUser = {
      id: `usr-${newTeacherId}`,
      role: 'teacher',
      username: tchUsername.trim() || `prof_${tchPhone.slice(-4)}`,
      phone: tchPhone.trim(),
      password: tchPassword.trim(),
      fullName: tchFullName.trim(),
      relatedId: newTeacherId,
      subject: tchSubject,
    };

    const newTeacher: Teacher = {
      id: newTeacherId,
      fullName: tchFullName.trim(),
      username: teacherUser.username,
      password: tchPassword.trim(),
      subject: tchSubject,
      coveredStreams: ['علوم تجريبية', 'رياضيات', 'تقني رياضي'],
      phone: tchPhone.trim(),
      email: `${teacherUser.username}@badhrat-ghad.dz`,
      bio: tchBio.trim() || 'أستاذ متطوع متميز في المبادرة.',
      volunteerHours: 0,
      centerName: tchCenter,
      activeSessionsCount: 0,
    };

    onRegisterTeacher(newTeacher, teacherUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute left-5 top-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl p-1 flex items-center justify-center mx-auto mb-2.5 shadow-xs">
            <BadhraLogo size={42} />
          </div>
          <h2 className="text-xl font-extrabold text-stone-900 tracking-tight">
            {mode === 'login' && 'تسجيل الدخول إلى المنصة'}
            {mode === 'register_student' && 'حساب تلميذ جديد - BAC & BEM'}
            {mode === 'register_teacher' && 'انضمام كأستاذ متطوع'}
            {mode === 'forgot_password' && 'استرجاع كلمة السر عبر البريد الإلكتروني'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {mode === 'forgot_password' 
              ? 'إرسال رابط آمن ورمز التحقق (OTP) إلى بريدك الإلكتروني لاستعادة حسابك'
              : 'المنصة الرقمية لجمعية بذرة غد الشبانية لمرافقة تلاميذ البكالوريا والتعليم المتوسط BEM'}
          </p>
        </div>

        {/* Global Feedback notices */}
        {successNotice && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Tabs for Login vs Register */}
        {mode !== 'forgot_password' && (
          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-2xl mb-5 text-xs font-bold text-center">
            <button
              onClick={() => { setMode('login'); setLoginError(''); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'login' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setMode('register_student'); setRegError(''); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'register_student' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              تسجيل تلميذ
            </button>
            <button
              onClick={() => { setMode('register_teacher'); setRegError(''); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'register_teacher' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              تسجيل أستاذ
            </button>
          </div>
        )}

        {/* 1. Login Mode */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                تحديد نوع الحساب:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedRole === 'student'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-600'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs">تلميذ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('teacher')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedRole === 'teacher'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-600'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <School className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs">أستاذ متطوع</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('association_admin')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedRole === 'association_admin'
                      ? 'border-stone-900 bg-stone-900 text-white font-bold ring-2 ring-stone-900'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span className="text-xs">إدارة الجمعية</span>
                </button>
              </div>
            </div>

            {selectedRole === 'association_admin' && (
              <div className="p-2.5 bg-stone-900 text-amber-300 rounded-xl text-[11px] font-medium flex items-center gap-2 border border-stone-800">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                <span>دخول محمي للإدارة: يتطلب اسم المستخدم السري أو الهاتف المعتمد وكلمة المرور المشفرة.</span>
              </div>
            )}

            {/* Username or Phone */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                اسم المستخدم أو رقم الهاتف:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder={
                    selectedRole === 'association_admin' 
                      ? 'اسم مستخدم الأدمن أو هاتف الإدارة' 
                      : 'أدخل اسم المستخدم أو رقم الهاتف'
                  }
                  required
                  className="w-full pl-3 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-medium"
                />
                <User className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-700">
                  كلمة السر:
                </label>
                <button
                  type="button"
                  onClick={() => { 
                    setMode('forgot_password'); 
                    setRecoveryEmailOrUser(loginIdentifier);
                    setRecoveryStage('input');
                    setRecoveryError('');
                  }}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                >
                  نسيت كلمة السر؟ (استرجاع بالبريد)
                </button>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="أدخل كلمة السر الخاصة بك"
                  required
                  className="w-full pl-9 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-stone-700 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 accent-emerald-700 cursor-pointer"
                />
                <span className="font-semibold text-stone-800">
                  البقاء قيد تسجيل الدخول دائماً (تذكرني على هذا الجهاز)
                </span>
              </label>
              <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                جلسة دائمة
              </span>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                selectedRole === 'association_admin' 
                  ? 'bg-stone-900 hover:bg-stone-800' 
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>دخول إلى حسابي</span>
            </button>

            {/* Preview Shortcuts for Public Testing (ONLY Student & Teacher - Zero Admin Exposure!) */}
            <div className="pt-3 border-t border-stone-100">
              <span className="text-[11px] font-bold text-stone-500 block mb-2 text-center">
                حسابات تجريبية للمعاينة (الطلاب والأساتذة فقط):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo('student')}
                  className="p-2 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 border border-stone-200 rounded-lg text-center cursor-pointer transition-colors"
                >
                  <GraduationCap className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-stone-800 block">تلميذ تجريبي</span>
                  <span className="text-[9px] text-stone-400 font-mono">yassine</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo('teacher')}
                  className="p-2 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-300 border border-stone-200 rounded-lg text-center cursor-pointer transition-colors"
                >
                  <School className="w-4 h-4 text-emerald-700 mx-auto mb-1" />
                  <span className="text-[10px] font-bold text-stone-800 block">أستاذ متطوع تجريبي</span>
                  <span className="text-[9px] text-stone-400 font-mono">benaissa</span>
                </button>
              </div>
            </div>

          </form>
        )}

        {/* 2. ADVANCED EMAIL PASSWORD RECOVERY (طلب المستخدم: إرسال رابط ورمز التحقق عبر البريد) */}
        {mode === 'forgot_password' && (
          <div className="space-y-4">
            
            {recoveryError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoverySuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{recoverySuccess}</span>
              </div>
            )}

            {/* Stage 1: Input Email */}
            {recoveryStage === 'input' && (
              <form onSubmit={handleRequestPasswordRecovery} className="space-y-4">
                <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 leading-relaxed border border-stone-200">
                  📧 أدخل <b>البريد الإلكتروني المسجل</b> أو <b>اسم المستخدم/الهاتف</b>. سيقوم النظام بإرسال رابط رسمي مشفر ورمز تحقق فوري (OTP) إلى بريدك لتأكيد ملكية الحساب.
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    البريد الإلكتروني المسجل (أو اسم المستخدم):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recoveryEmailOrUser}
                      onChange={(e) => setRecoveryEmailOrUser(e.target.value)}
                      placeholder="مثال: contact@badhrat-ghad.dz أو user@email.com"
                      required
                      className="w-full pl-3 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    طريقة الاسترجاع المرغوبة:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRecoveryMethod('code_and_link')}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                        recoveryMethod === 'code_and_link'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="block font-bold text-xs mb-0.5">🔗 رابط + رمز OTP</span>
                      <span className="text-[10px] text-stone-500 font-normal">تعيين كلمة سر جديدة تختارها بنفسك</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRecoveryMethod('temp_password')}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                        recoveryMethod === 'temp_password'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                          : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span className="block font-bold text-xs mb-0.5">🔑 كلمة سر جديدة فورية</span>
                      <span className="text-[10px] text-stone-500 font-normal">إرسال كلمة سر عشوائية مباشرة للبريد</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setRecoveryError(''); }}
                    className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    رجوع للدخول
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>إرسال إلى البريد الإلكتروني الآن</span>
                  </button>
                </div>
              </form>
            )}

            {/* Stage 2: Dispatched Email Simulator & OTP Entry */}
            {recoveryStage === 'sent' && dispatchedEmailData && (
              <div className="space-y-4">
                
                {/* Simulated Interactive Email Inbox Viewer */}
                <div className="bg-stone-900 text-white p-4 rounded-2xl border border-stone-800 space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2.5 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <Mail className="w-3.5 h-3.5" />
                      <span>رسالة بريد واردة جديدة (صندوق الوارد الرسمي)</span>
                    </span>
                    <span className="font-mono text-[10px]" dir="ltr">الآن</span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-stone-300">
                      <b>من:</b> <span className="font-mono text-emerald-300">no-reply@badhrat-ghad.dz</span> (جمعية بذرة غد)
                    </div>
                    <div className="text-stone-300">
                      <b>إلى:</b> <span className="font-mono text-amber-300">{dispatchedEmailData.targetEmail}</span>
                    </div>
                    <div className="text-stone-300 font-bold pt-1">
                      الموضوع: 🔐 رابط ورمز استرجاع كلمة المرور - بكالوريا 2027
                    </div>
                  </div>

                  <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 text-xs space-y-2.5">
                    <p className="text-stone-300 leading-relaxed">
                      مرحباً <b>{dispatchedEmailData.accountName}</b>، تلقينا طلباً لاسترجاع كلمة السر لحسابك. استخدم الرمز السري أدناه أو اضغط على الرابط:
                    </p>

                    {/* OTP Big Box */}
                    <div className="bg-emerald-950/80 border border-emerald-600/60 p-3 rounded-xl text-center">
                      <span className="text-[10px] text-emerald-300 block mb-1">رمز التحقق السري (OTP):</span>
                      <div className="font-mono text-2xl font-black text-amber-300 tracking-widest">
                        {dispatchedEmailData.otpCode}
                      </div>
                    </div>

                    {/* Clickable Quick Action inside email */}
                    <button
                      type="button"
                      onClick={() => {
                        setInputOtpCode(dispatchedEmailData.otpCode);
                        setRecoveryStage('resetting');
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>الضغط هنا لفتح صفحة تعيين كلمة المرور فوراً</span>
                    </button>
                  </div>
                </div>

                {/* Manual Code Input Form */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-stone-700">
                    أو أدخل رمز التحقق (OTP) المكون من 6 أرقام:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={inputOtpCode}
                      onChange={(e) => setInputOtpCode(e.target.value)}
                      placeholder="000000"
                      className="flex-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-stone-900 focus:outline-hidden focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtpAndProceed}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      تأكيد الرمز
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryStage('input')}
                    className="text-stone-500 hover:text-stone-800"
                  >
                    تغيير البريد الإلكتروني
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-emerald-700 font-bold"
                  >
                    رجوع لشاشة الدخول
                  </button>
                </div>

              </div>
            )}

            {/* Stage 3: New Password Form */}
            {recoveryStage === 'resetting' && (
              <form onSubmit={handleConfirmNewPassword} className="space-y-3.5">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <span>تم التحقق من البريد بنجاح لحساب: <b>{dispatchedEmailData?.accountName}</b></span>
                    <span className="block text-[10px] text-emerald-800">
                      يمكنك الآن تعيين كلمة سر جديدة وقوية لحسابك.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    كلمة السر الجديدة:
                  </label>
                  <input
                    type="password"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    placeholder="أدخل كلمة السر الجديدة"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    تأكيد كلمة السر الجديدة:
                  </label>
                  <input
                    type="password"
                    value={confirmPasswordVal}
                    onChange={(e) => setConfirmPasswordVal(e.target.value)}
                    placeholder="أعد إدخال كلمة السر الجديدة"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>حفظ وتعيين كلمة السر الجديدة في قاعدة البيانات</span>
                  </button>
                </div>
              </form>
            )}

            {/* Stage 4: Done */}
            {recoveryStage === 'done' && (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-stone-900 text-base">تم تحديث كلمة السر بنجاح!</h3>
                <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                  تم حفظ كلمة السر الجديدة في قاعدة البيانات المركزية، وهي جاهزة للاستخدام من أي جهاز.
                </p>

                {dispatchedEmailData?.tempPassword && (
                  <div className="p-3 bg-stone-100 rounded-xl text-xs font-mono border">
                    كلمة السر المؤقتة: <b className="text-emerald-800 text-sm">{dispatchedEmailData.tempPassword}</b>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRecoveryStage('input');
                    setDispatchedEmailData(null);
                    setRecoverySuccess('');
                  }}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  الانتقال لتسجيل الدخول بكلمة السر الجديدة
                </button>
              </div>
            )}

          </div>
        )}

        {/* 3. Student Register Mode */}
        {mode === 'register_student' && (
          <form onSubmit={handleStudentRegisterSubmit} className="space-y-3">
            {regError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">الاسم الكامل للتلميذ:</label>
              <input
                type="text"
                value={stdFullName}
                onChange={(e) => setStdFullName(e.target.value)}
                placeholder="مثال: يونس بوقرة"
                required
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">اسم المستخدم:</label>
                <input
                  type="text"
                  value={stdUsername}
                  onChange={(e) => setStdUsername(e.target.value)}
                  placeholder="younes"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">الشعبة:</label>
                <select
                  value={stdStream}
                  onChange={(e) => setStdStream(e.target.value as BacStream)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                >
                  {ALL_STREAMS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">رقم هاتف التلميذ:</label>
                <input
                  type="tel"
                  value={stdPhone}
                  onChange={(e) => setStdPhone(e.target.value)}
                  placeholder="0661000000"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">كلمة السر:</label>
                <input
                  type="password"
                  value={stdPassword}
                  onChange={(e) => setStdPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs mt-2"
            >
              إنشاء الحساب والانضمام لحصص الدعم
            </button>
          </form>
        )}

        {/* 4. Teacher Register Mode */}
        {mode === 'register_teacher' && (
          <form onSubmit={handleTeacherRegisterSubmit} className="space-y-3">
            {regError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">الاسم الكامل للأستاذ:</label>
              <input
                type="text"
                value={tchFullName}
                onChange={(e) => setTchFullName(e.target.value)}
                placeholder="أ. عبد الرحمن مصطفاوي"
                required
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">المادة المدرسة:</label>
                <input
                  type="text"
                  value={tchSubject}
                  onChange={(e) => setTchSubject(e.target.value)}
                  placeholder="الرياضيات"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">رقم الهاتف:</label>
                <input
                  type="tel"
                  value={tchPhone}
                  onChange={(e) => setTchPhone(e.target.value)}
                  placeholder="0550000000"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">كلمة السر:</label>
              <input
                type="password"
                value={tchPassword}
                onChange={(e) => setTchPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs mt-2"
            >
              تأكيد التسجيل وتفعيل فضاء الأستاذ
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
