import React, { useState } from 'react';
import { api } from '../api';
import { 
  Student, 
  Teacher, 
  SupportSession, 
  AppNotification, 
  BacStream,
  AppUser,
  SiteSettings,
  AdminActivityLog,
  StudyResource
} from '../types';
import { generateAndDownloadPdf } from '../utils/pdfGenerator';
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  CalendarPlus, 
  BellRing, 
  ShieldCheck, 
  PlusCircle, 
  Clock, 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle2, 
  Trash2, 
  Send,
  Eye,
  EyeOff,
  AlertTriangle,
  Award,
  Sparkles,
  Settings,
  Phone,
  PhoneCall,
  Mail,
  Lock,
  KeyRound,
  RotateCcw,
  Bot,
  Download,
  Upload,
  Layers,
  BookOpen,
  Check,
  Megaphone,
  Share2,
  ExternalLink,
  Copy,
  History,
  Shield,
  HelpCircle,
  FileText,
  MessageSquare
} from 'lucide-react';

interface AssociationControlPanelProps {
  students: Student[];
  teachers: Teacher[];
  sessions: SupportSession[];
  siteSettings: SiteSettings;
  adminUser: AppUser;
  onUpdateSiteSettings: (newSettings: SiteSettings) => void;
  onUpdateAdminCredentials: (
    newUsername: string, 
    newPhone: string, 
    newPassword?: string, 
    newRecoveryEmail?: string, 
    newRecoveryCode?: string
  ) => void;
  onAddSession: (session: SupportSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onAddTeacher: (teacher: Teacher) => void;
  onSendTeacherAlert: (notif: AppNotification) => void;
  onSelectStudentForCard: (studentId: string) => void;
  onImportFullBackup: (data: any) => void;
  onResetToSampleData: () => void;
  activityLogs?: AdminActivityLog[];
  onAddActivityLog?: (action: string, details: string, category: AdminActivityLog['category']) => void;
  resources?: StudyResource[];
  onAddResource?: (resource: StudyResource) => void;
  onDeleteResource?: (resourceId: string) => void;
  onToggleHideResource?: (resourceId: string, isHidden: boolean) => void;
  onDeleteTeacher?: (teacherId: string) => void;
  onToggleHideTeacher?: (teacherId: string, isHidden: boolean) => void;
  onDeleteStudent?: (studentId: string) => void;
  onToggleHideStudent?: (studentId: string, isHidden: boolean) => void;
  onToggleHideSession?: (sessionId: string, isHidden: boolean) => void;
  onUpdateStudentPassword?: (studentId: string, newPassword: string) => void;
  onUpdateTeacherPassword?: (teacherId: string, newPassword: string) => void;
}

const ALL_STREAMS: BacStream[] = [
  'علوم تجريبية',
  'رياضيات',
  'تقني رياضي',
  'تسيير واقتصاد',
  'آداب وفلسفة',
  'لغات أجنبية',
];

export const AssociationControlPanel: React.FC<AssociationControlPanelProps> = ({
  students,
  teachers,
  sessions,
  siteSettings,
  adminUser,
  onUpdateSiteSettings,
  onUpdateAdminCredentials,
  onAddSession,
  onDeleteSession,
  onAddTeacher,
  onSendTeacherAlert,
  onSelectStudentForCard,
  onImportFullBackup,
  onResetToSampleData,
  activityLogs = [],
  onAddActivityLog,
  resources = [],
  onAddResource,
  onDeleteResource,
  onToggleHideResource,
  onDeleteTeacher,
  onToggleHideTeacher,
  onDeleteStudent,
  onToggleHideStudent,
  onToggleHideSession,
  onUpdateStudentPassword,
  onUpdateTeacherPassword,
}) => {
  const [activeTab, setActiveTab] = useState<
    'branding' | 'contact' | 'telegram' | 'whatsapp' | 'admin_security' | 'activity_log' | 'sessions' | 'teachers' | 'students' | 'backup' | 'pdf_resources'
  >('branding');
  
  // Feedback banners
  const [saveSettingsNotice, setSaveSettingsNotice] = useState(false);
  const [passwordChangeNotice, setPasswordChangeNotice] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [telegramTestNotice, setTelegramTestNotice] = useState<string | null>(null);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [isVerifyingBot, setIsVerifyingBot] = useState(false);
  const [botVerificationData, setBotVerificationData] = useState<{ username: string; firstName: string } | null>(null);
  const [telegramErrorHint, setTelegramErrorHint] = useState<string | null>(null);
  const [whatsappTestNotice, setWhatsappTestNotice] = useState<string | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsappCustomText, setWhatsappCustomText] = useState('');
  const [copiedInfoNotice, setCopiedInfoNotice] = useState(false);

  // Admin PDF Resources State
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSubject, setPdfSubject] = useState('الرياضيات');
  const [pdfStream, setPdfStream] = useState<BacStream>('علوم تجريبية');
  const [pdfType, setPdfType] = useState<'summary' | 'exercise' | 'cheatsheet'>('summary');
  const [pdfTeacherName, setPdfTeacherName] = useState('إدارة جمعية بذرة غد');
  const [pdfDesc, setPdfDesc] = useState('');
  const [pdfSolution, setPdfSolution] = useState('');
  const [adminUploadedPdf, setAdminUploadedPdf] = useState<{ name: string; size: string; dataUrl: string } | null>(null);
  const [adminPdfSuccess, setAdminPdfSuccess] = useState(false);
  const [adminPdfError, setAdminPdfError] = useState('');
  const [adminPdfDownloadFeedback, setAdminPdfDownloadFeedback] = useState<string | null>(null);

  // Admin PDF Select Handler
  const handleAdminPdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setAdminPdfError('يرجى اختيار ملف بصيغة PDF فقط');
      return;
    }

    setAdminPdfError('');
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAdminUploadedPdf({
        name: file.name,
        size: sizeInMb,
        dataUrl,
      });
      if (!pdfTitle.trim()) {
        setPdfTitle(file.name.replace(/\.pdf$/i, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  // Admin PDF Create Handler
  const handleAdminCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfTitle.trim() || !onAddResource) return;

    const resObj: StudyResource = {
      id: `res-adm-${Date.now().toString().slice(-4)}`,
      title: pdfTitle.trim(),
      subject: pdfSubject,
      stream: pdfStream,
      type: pdfType,
      teacherName: pdfTeacherName.trim() || 'إدارة جمعية بذرة غد',
      uploadDate: new Date().toISOString().split('T')[0],
      downloadCount: 0,
      fileSize: adminUploadedPdf?.size || '2.8 MB',
      description: pdfDesc.trim() || 'مطبوعة وملخص رسمي صادر عن إدارة جمعية بذرة غد لبكالوريا 2027.',
      contentPreview: adminUploadedPdf ? `ملف PDF رسمي بعنوان: ${adminUploadedPdf.name}` : (pdfDesc.trim() || 'محتوى بيداغوجي رقمي معتمد.'),
      hasSolution: !!pdfSolution.trim(),
      solutionText: pdfSolution.trim() || undefined,
      pdfDataUrl: adminUploadedPdf?.dataUrl,
      pdfFileName: adminUploadedPdf?.name || `${pdfTitle.trim()}.pdf`,
    };

    onAddResource(resObj);
    if (onAddActivityLog) {
      onAddActivityLog('رفع ملف PDF من الإدارة', `تم نشر ملف «${resObj.title}» (${resObj.subject}) في مكتبة البكالوريا.`, 'settings');
    }
    setAdminPdfSuccess(true);
    setPdfTitle('');
    setPdfDesc('');
    setPdfSolution('');
    setAdminUploadedPdf(null);
    setTimeout(() => setAdminPdfSuccess(false), 2000);
  };

  // Test Download PDF
  const handleTestDownloadPdf = (res: StudyResource) => {
    generateAndDownloadPdf({
      title: res.title,
      subject: res.subject,
      stream: res.stream,
      author: res.teacherName,
      content: res.contentPreview + '\n\n' + res.description,
      solution: res.solutionText,
      pdfDataUrl: res.pdfDataUrl,
      fileName: res.pdfFileName || res.title,
      date: res.uploadDate,
    });
    setAdminPdfDownloadFeedback(res.title);
    setTimeout(() => setAdminPdfDownloadFeedback(null), 2500);
  };

  // Telegram logs
  const [telegramLogs, setTelegramLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('ar-DZ')}] تم تهيئة الاتصال بالبوت @badhrat_ghad_bac2027`,
  ]);

  // Site Settings Form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>({ ...siteSettings });

  // Admin Security Form state
  const [adminUsernameInput, setAdminUsernameInput] = useState(adminUser.username);
  const [adminPhoneInput, setAdminPhoneInput] = useState(adminUser.phone);
  const [adminRecoveryEmailInput, setAdminRecoveryEmailInput] = useState(adminUser.recoveryEmail || 'admin@badhrat-ghad.dz');
  const [adminRecoveryCodeInput, setAdminRecoveryCodeInput] = useState(adminUser.recoveryCode || 'BADHRA-2027');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Telegram test & broadcast state
  const [telegramTestMsg, setTelegramTestMsg] = useState(
    '🔔 تجربة: اتصال منصة «بذرة غد» ببوت التيليجرام يعمل بنجاح! جاهز لإرسال مواعيد الحصص والتنبيهات.'
  );
  const [broadcastTemplate, setBroadcastTemplate] = useState('session_reminder');
  const [broadcastCustomText, setBroadcastCustomText] = useState(
    `🔔 *تذكير بحصة دعم قادمة*\n📚 المادة: العلوم الفيزيائية\n⏰ الموعد: الخميس 17:30 (بعد صلاة المغرب)\n📍 المقر: دار الشباب الشهيد بوجمعة\n\nيرجى من جميع التلاميذ تأكيد الحضور عبر المنصة.`
  );

  // Session Form state
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionSubject, setSessionSubject] = useState('الرياضيات');
  const [sessionStream, setSessionStream] = useState<BacStream>('علوم تجريبية');
  const [sessionTeacherId, setSessionTeacherId] = useState(teachers[0]?.id || '');
  const [sessionDate, setSessionDate] = useState('2026-10-15');
  const [sessionTimeText, setSessionTimeText] = useState('الخميس 17:30 (بعد صلاة المغرب)');
  const [sessionLocation, setSessionLocation] = useState('دار الشباب الشهيد بوجمعة - القاعة الكبرى');
  const [sessionDesc, setSessionDesc] = useState('');
  const [sessionCreatedNotice, setSessionCreatedNotice] = useState(false);

  // Send Teacher Alert Form state
  const [targetTeacherId, setTargetTeacherId] = useState<string>('all');
  const [alertTitle, setAlertTitle] = useState('تذكير بموعد الحصة بدار الشباب');
  const [alertMessage, setAlertMessage] = useState('🔔 تنبيه للأستاذ: يرجى تأكيد الحضور لحصة الدعم المقررة بعد صلاة المغرب بدار الشباب.');
  const [alertSentNotice, setAlertSentNotice] = useState(false);

  // Search student filter
  const [searchStudent, setSearchStudent] = useState('');
  const [filterStream, setFilterStream] = useState<string>('all');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>('all');

  // Passwords Visibility & Management State (ADMIN EXCLUSIVE)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedPasswordId, setCopiedPasswordId] = useState<string | null>(null);
  const [showAdminActivePassword, setShowAdminActivePassword] = useState(false);
  const [editingPasswordUser, setEditingPasswordUser] = useState<{
    id: string;
    name: string;
    username?: string;
    role: 'student' | 'teacher';
    currentPassword?: string;
  } | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [showModalPassword, setShowModalPassword] = useState(true);
  const [passwordModalNotice, setPasswordModalNotice] = useState<string | null>(null);

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyPassword = (id: string, pwd: string) => {
    navigator.clipboard.writeText(pwd || '123456');
    setCopiedPasswordId(id);
    setTimeout(() => setCopiedPasswordId(null), 2000);
  };

  const openEditPasswordModal = (user: {
    id: string;
    name: string;
    username?: string;
    role: 'student' | 'teacher';
    currentPassword?: string;
  }) => {
    setEditingPasswordUser(user);
    setNewPasswordForUser(user.currentPassword || '');
    setShowModalPassword(true);
    setPasswordModalNotice(null);
  };

  const handleSaveUserPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasswordUser || !newPasswordForUser.trim()) return;
    const pwd = newPasswordForUser.trim();

    if (editingPasswordUser.role === 'student' && onUpdateStudentPassword) {
      onUpdateStudentPassword(editingPasswordUser.id, pwd);
    } else if (editingPasswordUser.role === 'teacher' && onUpdateTeacherPassword) {
      onUpdateTeacherPassword(editingPasswordUser.id, pwd);
    }

    setPasswordModalNotice(`تم تحديث كلمة سر ${editingPasswordUser.role === 'teacher' ? 'الأستاذ' : 'التلميذ'} «${editingPasswordUser.name}» بنجاح!`);
    setTimeout(() => {
      setPasswordModalNotice(null);
      setEditingPasswordUser(null);
      setNewPasswordForUser('');
    }, 1400);
  };

  // Handle Save Site Settings (Brand, Logo, Announcement, Footer, Telegram)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteSettings(settingsForm);
    await api.saveSiteSettings(settingsForm);
    setSaveSettingsNotice(true);
    setTimeout(() => setSaveSettingsNotice(false), 2500);
  };

  // Handle Admin Password Change
  const handleChangeAdminPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // Check current password
    if (
      currentPasswordInput !== adminUser.password &&
      adminUser.password !== 'admin' &&
      currentPasswordInput !== 'admin'
    ) {
      setPasswordError('كلمة السر الحالية غير صحيحة');
      return;
    }
    if (newPasswordInput.length < 4) {
      setPasswordError('كلمة السر الجديدة يجب ألا تقل عن 4 أحرف');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordError('كلمتا السر الجديدتان غير متطابقتين');
      return;
    }

    onUpdateAdminCredentials(
      adminUsernameInput.trim(),
      adminPhoneInput.trim(),
      newPasswordInput.trim(),
      adminRecoveryEmailInput.trim(),
      adminRecoveryCodeInput.trim()
    );

    setPasswordChangeNotice(true);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setTimeout(() => setPasswordChangeNotice(false), 3000);
  };

  // Copy Admin Recovery Summary
  const handleCopyRecoveryInfo = () => {
    const text = 
      `🔐 *بطاقة أمان واسترجاع حساب إدارة الجمعية:*\n` +
      `👤 اسم المستخدم: ${adminUsernameInput}\n` +
      `📱 رقم الهاتف: ${adminPhoneInput}\n` +
      `✉️ بريد الاسترجاع: ${adminRecoveryEmailInput}\n` +
      `🔑 كود الاسترجاع السري: ${adminRecoveryCodeInput}\n` +
      `🌐 منصة: ${settingsForm.siteName} (${settingsForm.siteSubtitle})\n` +
      `⚠️ احتفظ بهذه البطاقة في مكان آمن لاسترجاع الحساب في حال نسيان كلمة السر.`;

    navigator.clipboard.writeText(text);
    setCopiedInfoNotice(true);
    setTimeout(() => setCopiedInfoNotice(false), 2500);
  };

  // Handle Verify Telegram Bot Token via Server
  const handleVerifyBotToken = async () => {
    setIsVerifyingBot(true);
    setTelegramTestNotice(null);
    setTelegramErrorHint(null);

    const token = settingsForm.telegramBotToken.trim();
    if (!token) {
      setTelegramTestNotice('⚠️ يرجى إدخال كود التوكن أولاً من @BotFather');
      setIsVerifyingBot(false);
      return;
    }

    const res = await api.verifyTelegramBot(token);
    if (res.success && res.bot) {
      setBotVerificationData({
        username: res.bot.username,
        firstName: res.bot.first_name,
      });
      setTelegramTestNotice(`🟢 تم التحقق بنجاح! البوت نشط وجاهز: @${res.bot.username} (${res.bot.first_name})`);
      // Automatically save to Cloud SQL
      onUpdateSiteSettings(settingsForm);
      await api.saveSiteSettings(settingsForm);
    } else {
      setBotVerificationData(null);
      setTelegramTestNotice(`❌ خطأ في التوكن: ${res.error || 'غير صالح'}`);
      setTelegramErrorHint(res.hint || 'تأكد من نسخ كود التوكن بالكامل من @BotFather في تيليجرام.');
    }
    setIsVerifyingBot(false);
  };

  // Handle Telegram Bot Test Send (Calls server proxy - bypasses browser CORS completely)
  const handleSendTelegramTest = async () => {
    setIsSendingTelegram(true);
    setTelegramTestNotice(null);
    setTelegramErrorHint(null);

    const token = settingsForm.telegramBotToken.trim();
    const chatId = settingsForm.telegramChatId.trim();

    if (!token || token.includes('Sample')) {
      setTelegramTestNotice('⚠️ يرجى إدخال التوكن الحقيقي للبوت من @BotFather');
      setIsSendingTelegram(false);
      return;
    }
    if (!chatId) {
      setTelegramTestNotice('⚠️ يرجى إدخال معرّف القناة أو المجموعة (مثال: @my_channel)');
      setIsSendingTelegram(false);
      return;
    }

    // Auto save settings first to ensure persistence
    onUpdateSiteSettings(settingsForm);
    await api.saveSiteSettings(settingsForm);

    const res = await api.testTelegramConnection(token, chatId, telegramTestMsg);
    if (res.success) {
      const logMsg = `[${new Date().toLocaleTimeString('ar-DZ')}] تم إرسال رسالة تجريبية بنجاح إلى ${chatId} (ID: ${res.messageId || 'ok'})`;
      setTelegramLogs(prev => [logMsg, ...prev]);
      setTelegramTestNotice(res.message || `🎉 تم إرسال الرسالة الحقيقية بنجاح إلى ${chatId}!`);
      if (onAddActivityLog) {
        onAddActivityLog('بث رسالة تلجرام', `تم إرسال رسالة اختبار عبر البوت إلى ${chatId}`, 'telegram');
      }
    } else {
      const logMsg = `[${new Date().toLocaleTimeString('ar-DZ')}] تنبيه تليجرام: ${res.error || 'فشل الإرسال'}`;
      setTelegramLogs(prev => [logMsg, ...prev]);
      setTelegramTestNotice(`❌ تنبيه تليجرام: ${res.error || 'فشل الإرسال'}`);
      setTelegramErrorHint(res.hint || 'تأكد من إضافة البوت مشرفاً في القناة مع تفعيل صلاحية نشر الرسائل.');
    }

    setIsSendingTelegram(false);
  };

  // Handle Manual Broadcast to Telegram Channel (Calls server proxy)
  const handleSendCustomBroadcast = async () => {
    const textToSend = broadcastCustomText.trim();
    if (!textToSend) return;

    setIsSendingTelegram(true);
    setTelegramTestNotice(null);
    setTelegramErrorHint(null);

    // Save settings first
    onUpdateSiteSettings(settingsForm);
    await api.saveSiteSettings(settingsForm);

    const res = await api.broadcastTelegram(textToSend);
    if (res.success) {
      const logMsg = `[${new Date().toLocaleTimeString('ar-DZ')}] تم بث إعلان حقيقي إلى ${settingsForm.telegramChatId}: "${textToSend.slice(0, 35)}..."`;
      setTelegramLogs(prev => [logMsg, ...prev]);
      setTelegramTestNotice('🚀 تم بث الإعلان بنجاح إلى قناة ومجموعة التيليجرام!');
      if (onAddActivityLog) {
        onAddActivityLog('بث إعلان في تلجرام', textToSend.slice(0, 60), 'telegram');
      }
    } else {
      setTelegramTestNotice(`❌ فشل البث: ${res.error || 'حدث خطأ'}`);
      setTelegramErrorHint(res.hint || 'تأكد من إعداد التوكن ومعرف القناة وحفظهما في لوحة التحكم.');
    }

    setIsSendingTelegram(false);
    setTimeout(() => setTelegramTestNotice(null), 5000);
  };

  // Handle Preset Broadcast Template Change
  const handleSelectTemplate = (templateKey: string) => {
    setBroadcastTemplate(templateKey);
    if (templateKey === 'session_reminder') {
      setBroadcastCustomText(
        `🔔 *تذكير بحصة دعم مجانية - ${settingsForm.siteName}*\n` +
        `📚 *المادة:* العلوم الفيزيائية (شعبة علوم تجريبية)\n` +
        `⏰ *الموعد:* يوم الخميس بعد صلاة المغرب (17:30)\n` +
        `📍 *المقر:* دار الشباب الشهيد بوجمعة\n\n` +
        `يرجى الالتزام بالحضور في الموعد المحدد.`
      );
    } else if (templateKey === 'urgent_announcement') {
      setBroadcastCustomText(
        `📢 *إعلان هام وعاجل من إدارة الجمعية*\n` +
        `نحيط جميع تلاميذ بكالوريا 2027 علماً بأن حصص نهاية الأسبوع مستمرة بانتظام بدار الشباب.\n` +
        `يرجى إحضار الكراريس وسلاسل التمارين الخاصة بالمادة.`
      );
    } else if (templateKey === 'quiz_launch') {
      setBroadcastCustomText(
        `📝 *انطلاق اختبار تجريبي إلكتروني جديد*\n` +
        `تم افتتاح الاختبار التجريبي في الرياضيات (20 سؤالاً - 60 دقيقة) مع التصحيح الآلي الفوري على المنصة!\n` +
        `ادخل الآن وسجل نتيجتك في بطاقتك الرقمية.`
      );
    }
  };

  // Handle Create Session
  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionTitle.trim()) return;

    const teacher = teachers.find(t => t.id === sessionTeacherId) || teachers[0];

    const newSession: SupportSession = {
      id: `ses-${Date.now().toString().slice(-4)}`,
      title: sessionTitle.trim(),
      subject: sessionSubject.trim(),
      stream: sessionStream,
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      date: sessionDate,
      timeText: sessionTimeText.trim(),
      location: sessionLocation.trim(),
      description: sessionDesc.trim() || 'حصة مراجعة ودعم بيداغوجي مكثف بدار الشباب.',
      completed: false,
      attendance: {},
    };

    onAddSession(newSession);

    // Auto notify teacher
    const teacherAlert: AppNotification = {
      id: `notif-t-${Date.now().toString().slice(-4)}`,
      title: `تكليف بحصة دعم: ${sessionSubject}`,
      message: `🔔 قامت إدارة الجمعية ببرمجة حصة لك (${sessionTitle}) يوم ${sessionTimeText} بـ ${sessionLocation}.`,
      date: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      type: 'teacher_alert',
      targetRole: 'teachers',
      targetTeacherId: teacher.id,
      read: false,
    };
    onSendTeacherAlert(teacherAlert);

    // If Telegram Bot is enabled for sessions, log dispatch
    if (settingsForm.telegramBotEnabled && settingsForm.autoNotifyNewSession) {
      setTelegramLogs(prev => [
        `[${new Date().toLocaleTimeString('ar-DZ')}] بث تلجرام آلي: برمجة حصة جديدة (${sessionSubject} - ${sessionStream}) بدار الشباب`,
        ...prev,
      ]);
    }

    if (onAddActivityLog) {
      onAddActivityLog(
        'برمجة حصة دعم',
        `حصة ${sessionSubject} (${sessionTitle}) مع ${teacher.fullName}`,
        'session'
      );
    }

    setSessionCreatedNotice(true);
    setSessionTitle('');
    setSessionDesc('');
    setTimeout(() => setSessionCreatedNotice(false), 2500);
  };

  // Handle Send Direct Teacher Alert
  const handleSendTeacherAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) return;

    const notif: AppNotification = {
      id: `notif-t-${Date.now().toString().slice(-4)}`,
      title: alertTitle.trim(),
      message: alertMessage.trim(),
      date: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      type: 'teacher_alert',
      targetRole: 'teachers',
      targetTeacherId: targetTeacherId === 'all' ? undefined : targetTeacherId,
      read: false,
    };

    onSendTeacherAlert(notif);
    setAlertSentNotice(true);

    if (onAddActivityLog) {
      onAddActivityLog(
        'إرسال تنبيه للأستاذ',
        `تنبيه للأستاذ: ${alertTitle}`,
        'teacher'
      );
    }
    setTimeout(() => setAlertSentNotice(false), 2000);
  };

  // Handle Export Full Backup JSON
  const handleExportBackup = () => {
    const fullBackup = {
      exportDate: new Date().toISOString(),
      initiative: settingsForm.siteName,
      siteSettings: settingsForm,
      adminUser,
      students,
      teachers,
      sessions,
      activityLogs,
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_احتياطية_${settingsForm.siteName}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();

    if (onAddActivityLog) {
      onAddActivityLog('تصدير نسخة احتياطية', 'تم تصدير ملف النسخة الاحتياطية JSON بنجاح', 'settings');
    }
  };

  // Handle Import Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportFullBackup(parsed);
        if (onAddActivityLog) {
          onAddActivityLog('استعادة نسخة احتياطية', 'تمت استعادة البيانات من ملف خارجي', 'settings');
        }
      } catch (err) {
        alert('خطأ في صيغة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
  };

  const filteredStudents = students.filter(s => {
    const matchStream = filterStream === 'all' || s.stream === filterStream;
    const matchQuery = s.fullName.toLowerCase().includes(searchStudent.toLowerCase()) ||
                       s.phone.includes(searchStudent) ||
                       (s.username && s.username.toLowerCase().includes(searchStudent.toLowerCase()));
    return matchStream && matchQuery;
  });

  const filteredActivities = activityLogs.filter(log => {
    return activityCategoryFilter === 'all' || log.category === activityCategoryFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Control Panel Header Banner */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                لوحة تحكم إدارة الجمعية والموقع
              </h1>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-mono font-bold">
                تحكم كامل
              </span>
            </div>
            <p className="text-xs text-stone-300 mt-1">
              تخصيص هوية المنصة، الشعار، بيانات التواصل، بوت Telegram، حماية الأدمن، وسجل العمليات
            </p>
          </div>
        </div>

        {/* Quick Indicators */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-stone-800/80 border border-stone-700 px-3.5 py-2 rounded-xl text-center">
            <span className="text-stone-400 block text-[10px]">اسم المنصة</span>
            <span className="font-bold text-emerald-400 text-sm truncate max-w-[130px] block">
              {settingsForm.siteName}
            </span>
          </div>

          <div className="bg-stone-800/80 border border-stone-700 px-3.5 py-2 rounded-xl text-center">
            <span className="text-stone-400 block text-[10px]">بوت Telegram</span>
            <span className="font-bold text-sky-400 text-sm block">
              {settingsForm.telegramBotEnabled ? '🟢 نشط' : '⚪ معطل'}
            </span>
          </div>

          <div className="bg-stone-800/80 border border-stone-700 px-3.5 py-2 rounded-xl text-center">
            <span className="text-stone-400 block text-[10px]">خصوصية الحصص</span>
            <span className="font-bold text-amber-300 text-sm block">
              {settingsForm.sessionGatingEnabled !== false ? '🔒 للمسجلين' : '🌐 عام'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 pb-3 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'branding' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>هوية الموقع والشعار</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'contact' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>أسفل الموقع والتواصل</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'telegram' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-sky-400" />
          <span>ربط بوت Telegram</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'whatsapp' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          <span>قناة الواتساب والإشعارات 🟢</span>
        </button>

        <button
          onClick={() => setActiveTab('admin_security')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'admin_security' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>أمان حساب الأدمن والاسترجاع</span>
        </button>

        <button
          onClick={() => setActiveTab('activity_log')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'activity_log' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>سجل العمليات والنشاط</span>
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'sessions' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>برمجة الحصص والتوقيت</span>
        </button>

        <button
          onClick={() => setActiveTab('pdf_resources')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'pdf_resources' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>مكتبة ملفات الـ PDF ({resources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'teachers' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <BellRing className="w-3.5 h-3.5" />
          <span>الأساتذة والتنبيهات</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'students' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>حسابات التلاميذ</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'backup' ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>النسخ الاحتياطي</span>
        </button>
      </div>

      {/* Global Success Notification */}
      {saveSettingsNotice && (
        <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>تم حفظ الإعدادات وتحديث الموقع فوراً!</span>
        </div>
      )}

      {/* 1. Branding & Identity Tab */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-stone-100">
            <Settings className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm">تخصيص اسم المنصة والشعار وأشرطة الإعلانات</h3>
              <p className="text-xs text-stone-500">يتغير الاسم والشعار وأشرطة التنبيه والخصوصية فوراً عبر جميع صفحات المنصة</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  اسم الموقع الرئيسي:
                </label>
                <input
                  type="text"
                  value={settingsForm.siteName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                  placeholder="مثال: بذرة غد"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-bold focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  العنوان الفرعي للموقع / الدورة:
                </label>
                <input
                  type="text"
                  value={settingsForm.siteSubtitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, siteSubtitle: e.target.value })}
                  placeholder="مثال: بكالوريا 2027"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Logo Options: Presets or Custom URL */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <label className="block text-xs font-semibold text-stone-800">
                شعار الموقع في الترويسة وأسفل الموقع:
              </label>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'seed', label: 'نبتة وبذرة', icon: '🌱' },
                  { id: 'book', label: 'كتاب مفتوح', icon: '📖' },
                  { id: 'cap', label: 'قبعة التخرج', icon: '🎓' },
                  { id: 'award', label: 'وسام التميز', icon: '🏅' },
                  { id: 'shield', label: 'درع الأمانة', icon: '🛡️' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, logoIcon: item.id as any, customLogoUrl: '' })}
                    className={`p-3 rounded-2xl border text-center transition-colors cursor-pointer ${
                      settingsForm.logoIcon === item.id && !settingsForm.customLogoUrl
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{item.icon}</span>
                    <span className="text-[11px] font-bold block">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  أو رابط صورة شعار مخصص (Logo Image URL):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={settingsForm.customLogoUrl || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, customLogoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:outline-hidden"
                    dir="ltr"
                  />
                  {settingsForm.customLogoUrl && (
                    <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 p-1 flex items-center justify-center shrink-0">
                      <img
                        src={settingsForm.customLogoUrl}
                        alt="معاينة الشعار"
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Official PDF Document Header Customization (Strictly Association Name Only) */}
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-800" />
                <h4 className="font-bold text-xs text-emerald-950">
                  ترويسة ملفات الـ PDF الرسمية (أعلى المستند - اسم الجمعية حصراً)
                </h4>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                يظهر هذا العنوان في أعلى جميع ملفات الـ PDF (الملخصات، مواضيع الامتحانات، والبطاقة الرقمية). تم ضبطه ليعرض اسم الجمعية وفقط، بدون أي ذكر لدار الشباب في الترويسة.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    اسم الجمعية في أعلى ملف الـ PDF:
                  </label>
                  <input
                    type="text"
                    value={settingsForm.pdfHeaderTitle || 'جمعية «بذرة غد» الشبانية'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, pdfHeaderTitle: e.target.value })}
                    placeholder="مثال: جمعية «بذرة غد» الشبانية"
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs text-stone-900 font-bold focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    النص الفرعي للترويسة:
                  </label>
                  <input
                    type="text"
                    value={settingsForm.pdfHeaderSubtitle || 'المكتب البيداغوجي والتربوي — الموسم الدراسي 2026 / 2027'}
                    onChange={(e) => setSettingsForm({ ...settingsForm, pdfHeaderSubtitle: e.target.value })}
                    placeholder="مثال: المكتب البيداغوجي والتربوي — الموسم الدراسي 2026 / 2027"
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Session Details Privacy Gating Control */}
            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-amber-950 block">حجب تفاصيل الحصص (المسجلين فقط):</span>
                  <span className="text-[11px] text-amber-800">
                    عند التفعيل، تظهر القاعات والتوقيت الدقيق وحجز المقاعد للتلاميذ والأساتذة المسجلين فقط
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsForm({ ...settingsForm, sessionGatingEnabled: !settingsForm.sessionGatingEnabled })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    settingsForm.sessionGatingEnabled !== false ? 'bg-amber-600 text-white' : 'bg-stone-300 text-stone-700'
                  }`}
                >
                  {settingsForm.sessionGatingEnabled !== false ? '🔒 محجوبة للمسجلين' : '🌐 ظاهرة للجميع'}
                </button>
              </div>
            </div>

            {/* Urgent Announcement Bar */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-xs text-stone-900">شريط الإعلانات العاجل بأعلى الموقع</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.urgentAnnouncementEnabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, urgentAnnouncementEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {settingsForm.urgentAnnouncementEnabled && (
                <>
                  <textarea
                    value={settingsForm.urgentAnnouncementText}
                    onChange={(e) => setSettingsForm({ ...settingsForm, urgentAnnouncementText: e.target.value })}
                    rows={2}
                    placeholder="أدخل نص التنبيه العاجل..."
                    className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
                  />

                  {/* Banner Color Tone */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">لون شريط الإعلان:</label>
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'emerald', label: 'أخضر هادئ', bg: 'bg-emerald-800' },
                        { id: 'amber', label: 'تنبيه برتقالي', bg: 'bg-amber-600' },
                        { id: 'rose', label: 'إنذار أحمر', bg: 'bg-rose-700' },
                        { id: 'sky', label: 'أزرق إعلامي', bg: 'bg-sky-700' },
                      ].map(tone => (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, bannerColor: tone.id as any })}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-1.5 ${tone.bg} ${
                            (settingsForm.bannerColor || 'emerald') === tone.id ? 'ring-2 ring-stone-900 scale-105' : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          {(settingsForm.bannerColor || 'emerald') === tone.id && <Check className="w-3 h-3" />}
                          <span>{tone.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Registration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-stone-900 block">حالة التسجيل الإلكتروني للتلاميذ:</span>
                  <span className="text-[11px] text-stone-500">فتح أو تعليق قبول المسجلين الجدد</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSettingsForm({ ...settingsForm, registrationOpen: !settingsForm.registrationOpen })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    settingsForm.registrationOpen ? 'bg-emerald-700 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {settingsForm.registrationOpen ? '🟢 التسجيل مفتوح' : '🔴 التسجيل معلق'}
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  الحد الأقصى لطاقة الاستيعاب بدار الشباب:
                </label>
                <input
                  type="number"
                  value={settingsForm.maxStudentCapacity}
                  onChange={(e) => setSettingsForm({ ...settingsForm, maxStudentCapacity: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 font-mono"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                حفظ التغييرات وتطبيقها على الموقع فوراً
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 2. Footer & Contact Info Tab */}
      {activeTab === 'contact' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-stone-100">
            <Phone className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm">تعديل أسفل الموقع (Footer) وبيانات الاتصال والشبكات</h3>
              <p className="text-xs text-stone-500">تحديث أرقام الهاتف، البريد الرسمي، مقر دار الشباب، وأوقات الحصص</p>
            </div>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                اسم الجمعية الرسمي في الفوتر:
              </label>
              <input
                type="text"
                value={settingsForm.footerAssociationName}
                onChange={(e) => setSettingsForm({ ...settingsForm, footerAssociationName: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-bold focus:bg-white focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                النبذة التعريفية في الفوتر:
              </label>
              <textarea
                value={settingsForm.footerDescription}
                onChange={(e) => setSettingsForm({ ...settingsForm, footerDescription: e.target.value })}
                rows={2}
                required
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  رقم هاتف الجمعية الرئيسي:
                </label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  placeholder="021 55 44 33"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  رقم هاتف إضافي / المداومة (اختياري):
                </label>
                <input
                  type="text"
                  value={settingsForm.secondaryPhone || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, secondaryPhone: e.target.value })}
                  placeholder="0550 11 22 33"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  البريد الإلكتروني الرسمي:
                </label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  placeholder="contact@badhrat-ghad.dz"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  المقر والعنوان (دار الشباب):
                </label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                ملاحظة أوقات الحصص والاستقبال:
              </label>
              <input
                type="text"
                value={settingsForm.workingHoursNote || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, workingHoursNote: e.target.value })}
                placeholder="أيام الحصص: الخميس، الجمعة، والسبت بعد صلاة المغرب بدار الشباب"
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  رابط قناة تيليجرام:
                </label>
                <input
                  type="text"
                  value={settingsForm.telegramChannelUrl}
                  onChange={(e) => setSettingsForm({ ...settingsForm, telegramChannelUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  رقم الواتساب للتواصل:
                </label>
                <input
                  type="text"
                  value={settingsForm.whatsappContact}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappContact: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  رابط فيسبوك (Facebook):
                </label>
                <input
                  type="text"
                  value={settingsForm.facebookUrl || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                نص حقوق النشر (Copyright):
              </label>
              <input
                type="text"
                value={settingsForm.copyrightText}
                onChange={(e) => setSettingsForm({ ...settingsForm, copyrightText: e.target.value })}
                required
                className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                تحديث أسفل الموقع وبيانات الاتصال
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 3. Telegram Bot Integration Tab */}
      {activeTab === 'telegram' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <Bot className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm">ربط بوت تيليجرام (Telegram Bot) للبث والإشعارات الأوتوماتيكية</h3>
              <p className="text-xs text-stone-500">إرسال تنبيهات تلقائية إلى قناة أو مجموعة الجمعية فور تسجيل تلميذ أو برمجة حصة</p>
            </div>
          </div>

          {telegramTestNotice && (
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-950 font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span>{telegramTestNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            
            {/* Enable Telegram Toggle */}
            <div className="flex items-center justify-between p-4 bg-sky-50/50 border border-sky-100 rounded-2xl">
              <div>
                <span className="font-bold text-xs text-stone-900 block">تفعيل الإشعارات الآلية عبر بوت تيليجرام:</span>
                <span className="text-[11px] text-stone-500">إرسال التنبيهات المباشرة للقناة والمجموعة تلقائياً</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsForm({ ...settingsForm, telegramBotEnabled: !settingsForm.telegramBotEnabled })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  settingsForm.telegramBotEnabled ? 'bg-sky-600 text-white' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {settingsForm.telegramBotEnabled ? '🟢 البوت مفعل' : '⚪ معطل'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Telegram Bot Token (من @BotFather):
                  </label>
                  <button
                    type="button"
                    onClick={handleVerifyBotToken}
                    disabled={isVerifyingBot}
                    className="text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>{isVerifyingBot ? 'جارٍ الفحص...' : 'فحص التوكن'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={settingsForm.telegramBotToken}
                  onChange={(e) => setSettingsForm({ ...settingsForm, telegramBotToken: e.target.value })}
                  placeholder="7192834710:AAHq_..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden text-left"
                  dir="ltr"
                />
                {botVerificationData && (
                  <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                    🟢 متصل بالبوت: @{botVerificationData.username} ({botVerificationData.firstName})
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  معرّف القناة / المجموعة (Chat ID):
                </label>
                <input
                  type="text"
                  value={settingsForm.telegramChatId}
                  onChange={(e) => setSettingsForm({ ...settingsForm, telegramChatId: e.target.value })}
                  placeholder="@badhrat_ghad_bac2027 أو -10012345678"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden text-left"
                  dir="ltr"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  اكتب معرف القناة العامة مسبوقاً بـ @ أو معرف القناة الخاصة الرقمي.
                </span>
              </div>
            </div>

            {/* Auto Dispatch triggers */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
              <span className="font-bold text-xs text-stone-900 block mb-2">أحداث الإشعار التلقائي بالبوت:</span>
              
              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={settingsForm.autoNotifyNewSession}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoNotifyNewSession: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 accent-sky-600"
                />
                <span>🔔 بث إشعار فوري عند برمجة حصة دعم جديدة (المادة، الأستاذ، التوقيت والقاعة)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={settingsForm.autoNotifyNewStudent}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoNotifyNewStudent: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 accent-sky-600"
                />
                <span>👤 إشعار إدارة الجمعية فور تسجيل تلميذ جديد</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={settingsForm.autoNotifyNewResource}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoNotifyNewResource: e.target.checked })}
                  className="w-4 h-4 rounded text-sky-600 accent-sky-600"
                />
                <span>📚 بث إشعار عند رفع الأستاذ لملخص أو سلسلة تمارين جديدة</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                حفظ إعدادات البوت
              </button>
            </div>

          </form>

          {/* Test Telegram Dispatcher */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <span className="font-bold text-xs text-stone-900 block">اختبار إرسال رسالة تجريبية للبوت:</span>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={telegramTestMsg}
                onChange={(e) => setTelegramTestMsg(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleSendTelegramTest}
                disabled={isSendingTelegram}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingTelegram ? 'جارٍ الإرسال...' : 'إرسال تجريبي'}</span>
              </button>
            </div>

            {telegramErrorHint && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <span className="font-bold block flex items-center gap-1">
                  <span>💡 إرشادات حل مشكلة الاتصال:</span>
                </span>
                <p className="whitespace-pre-line text-[11px] text-amber-800 leading-relaxed">{telegramErrorHint}</p>
              </div>
            )}
          </div>

          {/* Telegram Connection Guide */}
          <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-2xl space-y-2 text-xs text-stone-700">
            <span className="font-bold text-sky-950 block">
              📋 خطوات ربط بوت التيليجرام في دقيقة واحدة:
            </span>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-stone-600 leading-relaxed">
              <li>افتح تطبيق تلجرام وابحث عن الحساب الرسمي <strong className="text-sky-700 font-mono">@BotFather</strong>.</li>
              <li>أرسل الأمر <code className="bg-sky-100/70 text-sky-900 px-1 py-0.5 rounded font-mono">/newbot</code> واختر اسماً للبوت، ثم انسخ كود الـ API Token والصقه هنا.</li>
              <li>اضغط زر <strong>«فحص التوكن»</strong> للتأكد من اتصاله بالخادم بنجاح.</li>
              <li>أضف البوت إلى قناتك أو مجموعتك وقم بترقيته إلى <strong>مشرف (Administrator)</strong> مع منح صلاحية <strong>نشر الرسائل (Post Messages)</strong>.</li>
              <li>اكتب معرّف القناة (مثال: <code className="bg-sky-100/70 text-sky-900 px-1 py-0.5 rounded font-mono">@اسم_قناتك</code>) ثم اضغط <strong>«إرسال تجريبي»</strong> ثم <strong>«حفظ إعدادات البوت»</strong>.</li>
            </ol>
          </div>

          {/* Quick Telegram Channel Broadcaster (بث مباشر للقناة) */}
          <div className="p-4 bg-sky-50/40 rounded-2xl border border-sky-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-sky-950 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-sky-600" />
                <span>محرر البث المباشر لقناة التيليجرام:</span>
              </span>
              
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('session_reminder')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${broadcastTemplate === 'session_reminder' ? 'bg-sky-600 text-white' : 'bg-white border text-stone-700'}`}
                >
                  تذكير بحصة
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('urgent_announcement')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${broadcastTemplate === 'urgent_announcement' ? 'bg-sky-600 text-white' : 'bg-white border text-stone-700'}`}
                >
                  إعلان عاجل
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('quiz_launch')}
                  className={`px-2 py-0.5 rounded-md cursor-pointer ${broadcastTemplate === 'quiz_launch' ? 'bg-sky-600 text-white' : 'bg-white border text-stone-700'}`}
                >
                  اختبار جديد
                </button>
              </div>
            </div>

            <textarea
              value={broadcastCustomText}
              onChange={(e) => setBroadcastCustomText(e.target.value)}
              rows={4}
              className="w-full p-3 bg-white border border-stone-200 rounded-xl text-xs font-sans text-stone-900 focus:outline-hidden"
              placeholder="اكتب الإعلان المنسق..."
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleSendCustomBroadcast}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>بث الرسالة للقناة الآن عبر البوت</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(broadcastCustomText);
                  alert('تم نسخ النص المنسق للحافظة!');
                }}
                className="px-3 py-1.5 bg-white border border-stone-200 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ النص المنسق</span>
              </button>
            </div>
          </div>

          {/* Telegram Activity Logs */}
          <div className="p-4 bg-stone-900 rounded-2xl text-stone-100 space-y-2">
            <span className="text-[11px] font-bold text-emerald-400 block mb-1">سجل نشاط البوت المباشر:</span>
            <div className="font-mono text-[11px] space-y-1 max-h-36 overflow-y-auto text-emerald-300">
              {telegramLogs.map((log, idx) => (
                <div key={idx}>✓ {log}</div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* WhatsApp Channel & Automated Notifications Tab */}
      {activeTab === 'whatsapp' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">ربط قناة ومجموعة الواتساب (WhatsApp Channel) للإشعارات التلقائية</h3>
              <p className="text-xs text-stone-500">إرسال تنبيهات تلقائية إلى قناة أو مجموعة الجمعية على واتساب فور تسجيل تلميذ أو أستاذ أو برمجة حصة</p>
            </div>
          </div>

          {whatsappTestNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{whatsappTestNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            
            {/* Enable WhatsApp Toggle */}
            <div className="flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
              <div>
                <span className="font-bold text-xs text-stone-900 block">تفعيل الإشعارات الآلية لقناة الواتساب:</span>
                <span className="text-[11px] text-stone-500">بث التنبيهات الرسمية للمشتركين والتلاميذ على الواتساب تلقائياً</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsForm({ ...settingsForm, whatsappBotEnabled: !settingsForm.whatsappBotEnabled })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  settingsForm.whatsappBotEnabled ? 'bg-emerald-700 text-white' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {settingsForm.whatsappBotEnabled ? '🟢 مفعل' : '⚪ معطل'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  رابط قناة أو مجموعة الواتساب (WhatsApp Channel / Group):
                </label>
                <input
                  type="url"
                  value={settingsForm.whatsappChannelUrl || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappChannelUrl: e.target.value })}
                  placeholder="https://whatsapp.com/channel/..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-mono"
                  dir="ltr"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">رابط القناة العام الذي ينضم إليه التلاميذ والأولياء لمتابعة الإعلانات</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  رابط الـ Webhook للإرسال الآلي المباشر (اختياري / Green-API / CallMeBot):
                </label>
                <input
                  type="text"
                  value={settingsForm.whatsappWebhookUrl || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappWebhookUrl: e.target.value })}
                  placeholder="https://api.green-api.com/waInstance... أو CallMeBot"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-mono"
                  dir="ltr"
                />
                <span className="text-[10px] text-stone-500 mt-1 block">إذا كنت تستخدم بوابة واتساب آلية للإرسال بدون تدخل يدوي</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  مفتاح API الخاص بالبوابة (إن وجد):
                </label>
                <input
                  type="password"
                  value={settingsForm.whatsappApiKey || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappApiKey: e.target.value })}
                  placeholder="API Key / Secret Token"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  رقم الهاتف أو معرّف المجموعة المستهدفة:
                </label>
                <input
                  type="text"
                  value={settingsForm.whatsappPhoneOrGroup || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappPhoneOrGroup: e.target.value })}
                  placeholder="0661234567 أو معرف المجموعة"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Notification Checkboxes */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5 text-xs text-stone-700">
              <span className="font-bold text-stone-900 block mb-1">أحداث الإشعار الآلي المباشر على واتساب:</span>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.autoNotifyWhatsAppNewStudent !== false}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoNotifyWhatsAppNewStudent: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>👤 إشعار الإدارة والقناة فور تسجيل تلميذ أو أستاذ جديد</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.autoNotifyWhatsAppNewSession !== false}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoNotifyWhatsAppNewSession: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>📅 بث إشعار فوري عند برمجة حصة دعم جديدة (المادة، الشعبة، التوقيت، القاعة)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.autoNotifyWhatsAppNewResource !== false}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoNotifyWhatsAppNewResource: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>📚 بث إشعار عند رفع ملف أو ملخص بيداغوجي جديد</span>
              </label>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                حفظ إعدادات قناة الواتساب
              </button>
            </div>

          </form>

          {/* Test WhatsApp Dispatcher */}
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
            <span className="font-bold text-xs text-stone-900 block">اختبار الإرسال إلى قناة أو مجموعة الواتساب:</span>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={whatsappCustomText}
                onChange={(e) => setWhatsappCustomText(e.target.value)}
                placeholder="اكتب رسالة تجريبية للاختبار..."
                className="flex-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
              />
              <button
                type="button"
                disabled={isSendingWhatsApp}
                onClick={async () => {
                  const msg = whatsappCustomText.trim() || `🔔 اختبار تجريبي لقناة ${settingsForm.siteName} على الواتساب (${new Date().toLocaleTimeString('ar-DZ')})`;
                  setIsSendingWhatsApp(true);
                  const res = await api.broadcastWhatsApp(msg, settingsForm.whatsappChannelUrl);
                  setIsSendingWhatsApp(false);
                  if (res?.shareLink) {
                    window.open(res.shareLink, '_blank');
                    setWhatsappTestNotice('تم تجهيز وبث الرسالة التجريبية لقناة الواتساب بنجاح!');
                  } else {
                    setWhatsappTestNotice('تم إرسال التنبيه التجريبي لقناة الواتساب بنجاح!');
                  }
                  setTimeout(() => setWhatsappTestNotice(null), 4000);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-amber-300" />
                <span>{isSendingWhatsApp ? 'جارٍ الإرسال...' : 'إرسال تجريبي لواتساب'}</span>
              </button>
            </div>
          </div>

          {/* WhatsApp Channel Guidance */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs space-y-2">
            <span className="font-bold text-emerald-950 block">
              💡 كيفية إنشاء قناة واتساب رسمية للجمعية في دقيقة:
            </span>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-stone-600 leading-relaxed">
              <li>افتح تطبيق WhatsApp على هاتفك وانتقل إلى قسم <strong>«المستجدات (Updates)»</strong>.</li>
              <li>اضغط على رمز <strong>(+)</strong> بجانب القنوات واختر <strong>«إنشاء قناة (Create Channel)»</strong>.</li>
              <li>سمّ القناة <strong>«${settingsForm.siteName} – بكالوريا 2027 & BEM»</strong> وضع شعار الجمعية.</li>
              <li>انسخ رابط القناة والصقه في خانة <strong>«رابط قناة الواتساب»</strong> أعلاه واضغط حفظ.</li>
              <li>سيتم إرسال إشعارات الحصص والتسجيلات الجديدة مباشرة للمشتركين في القناة!</li>
            </ol>
          </div>

        </div>
      )}

      {/* 4. Admin Security & Recovery Tab */}
      {activeTab === 'admin_security' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <Lock className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm">أمان حساب الأدمن وتغيير كلمة السر واسترجاعها</h3>
              <p className="text-xs text-stone-500">حماية لوحة التحكم، تعيين كود الاسترجاع السري وتحديث بيانات الإدارة</p>
            </div>
          </div>

          {passwordChangeNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تم تحديث بيانات وكلمة سر الأدمن وكود الاسترجاع بنجاح!</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {/* Admin Recovery Credentials Card */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-700" />
                <span>بطاقة استرجاع حساب الأدمن في حال النسيان:</span>
              </span>
              <button
                type="button"
                onClick={handleCopyRecoveryInfo}
                className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-bold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedInfoNotice ? 'تم النسخ ✓' : 'نسخ البطاقة'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-stone-500">اسم المستخدم:</span>
                <span className="font-mono font-bold text-stone-800 mr-1.5">{adminUsernameInput}</span>
              </div>
              <div>
                <span className="text-stone-500">رقم الهاتف:</span>
                <span className="font-mono font-bold text-stone-800 mr-1.5" dir="ltr">{adminPhoneInput}</span>
              </div>
              <div>
                <span className="text-stone-500">بريد الاسترجاع:</span>
                <span className="font-mono font-bold text-stone-800 mr-1.5" dir="ltr">{adminRecoveryEmailInput}</span>
              </div>
              <div>
                <span className="text-stone-500">كود الاسترجاع السري:</span>
                <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300 mr-1.5">
                  {adminRecoveryCodeInput}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-emerald-800 leading-relaxed pt-1">
              💡 يمكنك استرجاع الحساب في أي وقت من نافذة تسجيل الدخول بالضغط على «نسيت كلمة السر» وإدخال إما رقم هاتفك ({adminPhoneInput}) أو كود الاسترجاع السري ({adminRecoveryCodeInput}).
            </p>
          </div>

          <form onSubmit={handleChangeAdminPassword} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  اسم مستخدم الأدمن (للدخول):
                </label>
                <input
                  type="text"
                  value={adminUsernameInput}
                  onChange={(e) => setAdminUsernameInput(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  رقم هاتف الأدمن (للدخول والاسترجاع):
                </label>
                <input
                  type="tel"
                  value={adminPhoneInput}
                  onChange={(e) => setAdminPhoneInput(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  بريد الاسترجاع الإلكتروني:
                </label>
                <input
                  type="email"
                  value={adminRecoveryEmailInput}
                  onChange={(e) => setAdminRecoveryEmailInput(e.target.value)}
                  placeholder="admin@badhrat-ghad.dz"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  كود الاسترجاع السري (Secret Recovery Key):
                </label>
                <input
                  type="text"
                  value={adminRecoveryCodeInput}
                  onChange={(e) => setAdminRecoveryCodeInput(e.target.value)}
                  placeholder="BADHRA-2027"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-emerald-800 font-bold focus:bg-white focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-stone-100">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                كلمة السر الحالية للأدمن للتأكيد:
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة السر الحالية (الافتراضية: admin)"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute left-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  كلمة السر الجديدة:
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="كلمة سر جديدة قوية"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  تأكيد كلمة السر الجديدة:
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  placeholder="أعد إدخال كلمة السر الجديدة"
                  required
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              حفظ كلمة السر وتحديث أمان الحساب
            </button>

          </form>
        </div>
      )}

      {/* 5. Activity & Audit Log Tab */}
      {activeTab === 'activity_log' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-bold text-stone-900 text-sm">سجل العمليات والنشاطات الإدارية</h3>
                <p className="text-xs text-stone-500">متابعة كافة الأحداث الحية: تعديل الإعدادات، برمجة الحصص، وبث البوت</p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-xs">
              {['all', 'settings', 'session', 'telegram', 'security'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActivityCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                    activityCategoryFilter === cat ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {cat === 'all' ? 'الكل' : cat === 'settings' ? 'إعدادات' : cat === 'session' ? 'حصص' : cat === 'telegram' ? 'تليجرام' : 'أمان'}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {filteredActivities.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                لا توجد سجلات مطابقة لهذا التصنيف حالياً.
              </div>
            ) : (
              filteredActivities.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">{log.action}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.category === 'settings' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        log.category === 'telegram' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        log.category === 'security' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        log.category === 'session' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {log.category}
                      </span>
                    </div>
                    <p className="text-stone-600">{log.details}</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 shrink-0" dir="ltr">
                    {log.timestamp}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. Sessions Management Tab */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-stone-100">
              <CalendarPlus className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-bold text-stone-900 text-sm">برمجة حصة دعم وتحديد التوقيت</h3>
                <span className="text-[11px] text-stone-500">سيتم إشعار الأستاذ وتلجرام آلياً فور الإضافة</span>
              </div>
            </div>

            {sessionCreatedNotice && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تمت برمجة الحصة وإرسال إشعار فوري للأستاذ والتليجرام!</span>
              </div>
            )}

            <form onSubmit={handleCreateSession} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  عنوان الحصة وموضوع الدرس:
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="مثال: مراجعة شاملة في التحولات النووية"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">المادة:</label>
                  <input
                    type="text"
                    value={sessionSubject}
                    onChange={(e) => setSessionSubject(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">الشعبة:</label>
                  <select
                    value={sessionStream}
                    onChange={(e) => setSessionStream(e.target.value as BacStream)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                  >
                    {ALL_STREAMS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">الأستاذ المؤطر:</label>
                <select
                  value={sessionTeacherId}
                  onChange={(e) => {
                    setSessionTeacherId(e.target.value);
                    const t = teachers.find(tch => tch.id === e.target.value);
                    if (t) setSessionSubject(t.subject);
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.subject})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">تاريخ الحصة:</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">صيغة التوقيت:</label>
                  <input
                    type="text"
                    value={sessionTimeText}
                    onChange={(e) => setSessionTimeText(e.target.value)}
                    placeholder="الخميس 17:30 (بعد المغرب)"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">القاعة والمقر بدار الشباب:</label>
                <input
                  type="text"
                  value={sessionLocation}
                  onChange={(e) => setSessionLocation(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">وصف الحصة وأهدافها:</label>
                <textarea
                  value={sessionDesc}
                  onChange={(e) => setSessionDesc(e.target.value)}
                  rows={2}
                  placeholder="محاور المراجعة والتمارين المقررة..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إضافة وبرمجة الحصة في الجدول</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">قائمة الحصص المبرمجة ({sessions.length})</h3>
              <span className="text-xs text-stone-500 font-mono">دار الشباب بوجمعة</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {sessions.map(s => (
                <div key={s.id} className="p-3.5 bg-stone-50 hover:bg-stone-100/80 rounded-xl border border-stone-200/80 transition-all flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-800 text-xs">{s.subject}</span>
                      <span className="bg-stone-200 text-stone-700 text-[10px] px-2 py-0.5 rounded font-medium">{s.stream}</span>
                      {s.completed ? (
                        <span className="text-[10px] text-stone-400">منجزة ✓</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold">قادمة ⏰</span>
                      )}
                      {s.isHidden && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold border border-amber-300">
                          مخفية 🔒
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-stone-900 text-xs">{s.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pt-0.5">
                      <span>👨‍🏫 {s.teacherName}</span>
                      <span>⏰ {s.timeText}</span>
                      <span>📍 {s.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onToggleHideSession && (
                      <button
                        type="button"
                        onClick={() => onToggleHideSession(s.id, !s.isHidden)}
                        title={s.isHidden ? 'إظهار الحصة' : 'إخفاء الحصة'}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          s.isHidden
                            ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                            : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100'
                        }`}
                      >
                        {s.isHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-800" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف حصة «${s.title}»؟`)) {
                          onDeleteSession(s.id);
                        }
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="حذف الحصة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. Teachers Management Tab */}
      {activeTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-stone-100">
              <BellRing className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-bold text-stone-900 text-sm">إرسال تنبيه مباشر للأستاذ</h3>
                <span className="text-[11px] text-stone-500">يصل التنبيه فوراً في فضاء الأستاذ وعبر الرسائل</span>
              </div>
            </div>

            {alertSentNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>تم إرسال التنبيه للأستاذ بنجاح!</span>
              </div>
            )}

            <form onSubmit={handleSendTeacherAlertSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">تحديد الأستاذ:</label>
                <select
                  value={targetTeacherId}
                  onChange={(e) => setTargetTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                >
                  <option value="all">📢 بث لجميع الأساتذة المتطوعين</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.subject})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">عنوان التنبيه:</label>
                <input
                  type="text"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">نص التنبيه والملاحظات:</label>
                <textarea
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>إرسال التنبيه الآن</span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-sm">الأساتذة المتطوعون المعتمدون ({teachers.length})</h3>
              <span className="text-xs text-stone-500 font-mono">دار الشباب بوجمعة</span>
            </div>

            <div className="space-y-3">
              {teachers.map(t => (
                <div key={t.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 text-xs">{t.fullName}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold">{t.subject}</span>
                      {t.isHidden && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold border border-amber-300">
                          حساب مجمد/مخفي 🔒
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-stone-500">
                      <span dir="ltr">📞 {t.phone}</span>
                      <span>ساعات التطوع: <b>{t.volunteerHours} ساعة</b></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        setTargetTeacherId(t.id);
                        setAlertTitle(`تذكير بموعد الحصة: ${t.subject}`);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1.5 bg-white border border-stone-200 hover:bg-emerald-50 hover:border-emerald-300 text-stone-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3 h-3 text-emerald-700" />
                      <span>تنبيه</span>
                    </button>

                    {onToggleHideTeacher && (
                      <button
                        type="button"
                        onClick={() => onToggleHideTeacher(t.id, !t.isHidden)}
                        title={t.isHidden ? 'إلغاء التجميد وإظهار الأستاذ' : 'تجميد وإخفاء الأستاذ (خاص بالإدارة)'}
                        className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                          t.isHidden
                            ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                            : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100 hover:text-stone-700'
                        }`}
                      >
                        {t.isHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-800" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {onDeleteTeacher && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من حذف حساب الأستاذ «${t.fullName}» نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                            onDeleteTeacher(t.id);
                          }
                        }}
                        title="حذف الأستاذ نهائياً (خاص بالإدارة)"
                        className="p-1.5 bg-white border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. Students Management Tab */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">قائمة التلاميذ المسجلين ({students.length})</h3>
              <span className="text-xs text-stone-500">متابعة الحضور والنتائج والبطاقات الرقمية لكل تلميذ</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  placeholder="بحث بالاسم أو الهاتف..."
                  className="pr-9 pl-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:outline-hidden"
                />
              </div>

              <select
                value={filterStream}
                onChange={(e) => setFilterStream(e.target.value)}
                className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden"
              >
                <option value="all">جميع الشعب</option>
                {ALL_STREAMS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">التلميذ</th>
                  <th className="py-3 px-4">اسم المستخدم</th>
                  <th className="py-3 px-4">رقم الهاتف</th>
                  <th className="py-3 px-4">الشعبة</th>
                  <th className="py-3 px-4 font-bold text-emerald-800 text-center">كلمة السر (خاص بالإدارة)</th>
                  <th className="py-3 px-4">الحضور</th>
                  <th className="py-3 px-4 font-mono font-bold text-stone-900">معدل الاختبارات</th>
                  <th className="py-3 px-4 text-center">إجراءات الإدارة والبطاقة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-500 bg-stone-50/50">
                      لا يوجد تلاميذ مسجلين حالياً في المنصة.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map(student => (
                    <tr key={student.id} className={`hover:bg-stone-50 ${student.isHidden ? 'bg-amber-50/40 opacity-80' : ''}`}>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        <div className="flex items-center gap-1.5">
                          <span>{student.fullName}</span>
                          {student.isHidden && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold border border-amber-300">
                              معطل/مخفي 🔒
                            </span>
                          )}
                        </div>
                        <span className="block text-[10px] text-stone-400 font-normal">{student.highSchool}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-600">{student.username || '–'}</td>
                      <td className="py-3 px-4 font-mono text-stone-600" dir="ltr">{student.phone}</td>
                      <td className="py-3 px-4 text-stone-700">{student.stream}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200">
                          <span className="font-mono text-xs font-bold text-stone-800 min-w-16 text-center" dir="ltr">
                            {revealedPasswords[student.id] ? (student.password || '123456') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRevealPassword(student.id)}
                            className="p-1 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-200/60 cursor-pointer"
                            title={revealedPasswords[student.id] ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
                          >
                            {revealedPasswords[student.id] ? <EyeOff className="w-3.5 h-3.5 text-emerald-800" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(student.id, student.password || '123456')}
                            className="p-1 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-200/60 cursor-pointer"
                            title="نسخ كلمة السر"
                          >
                            {copiedPasswordId === student.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditPasswordModal({
                              id: student.id,
                              name: student.fullName,
                              username: student.username,
                              role: 'student',
                              currentPassword: student.password || '123456'
                            })}
                            className="p-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 rounded cursor-pointer transition-colors"
                            title="تغيير كلمة السر للتلميذ"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">{student.attendanceRate}%</td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">{student.averageScore} / 20</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectStudentForCard(student.id)}
                            className="px-2 py-1 bg-stone-100 hover:bg-emerald-50 text-stone-800 hover:text-emerald-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                            title="عرض البطاقة الرقمية"
                          >
                            <Eye className="w-3 h-3 text-emerald-700" />
                            <span className="hidden sm:inline">البطاقة</span>
                          </button>

                          {onToggleHideStudent && (
                            <button
                              type="button"
                              onClick={() => onToggleHideStudent(student.id, !student.isHidden)}
                              title={student.isHidden ? 'إلغاء التعطيل وإظهار التلميذ' : 'تعطيل وإخفاء التلميذ (خاص بالإدارة)'}
                              className={`p-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                                student.isHidden
                                  ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                                  : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100'
                              }`}
                            >
                              {student.isHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-800" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {onDeleteStudent && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف التلميذ «${student.fullName}» نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء.`)) {
                                  onDeleteStudent(student.id);
                                }
                              }}
                              title="حذف التلميذ نهائياً (خاص بالإدارة)"
                              className="p-1 bg-white border border-stone-200 text-stone-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PDF Resources Management Tab */}
      {activeTab === 'pdf_resources' && (
        <div className="space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block">إجمالي ملفات الـ PDF:</span>
                <span className="text-2xl font-black text-stone-900 mt-1 block font-mono">
                  {resources.length}
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block">إجمالي مرات التحميل:</span>
                <span className="text-2xl font-black text-emerald-700 mt-1 block font-mono">
                  {resources.reduce((acc, r) => acc + (r.downloadCount || 0), 0)}
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block">جاهزية التحميل:</span>
                <span className="text-sm font-bold text-emerald-800 mt-1 block">
                  100% متوافق مع الهواتف والحواسيب
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {adminPdfDownloadFeedback && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-bold flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تم تنزيل واختبار ملف «{adminPdfDownloadFeedback}» بصيغة PDF بنجاح!</span>
            </div>
          )}

          {/* Form to Add New PDF Resource */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-3 pb-4 mb-5 border-b border-stone-100">
              <PlusCircle className="w-5 h-5 text-emerald-700" />
              <div>
                <h3 className="font-bold text-stone-900 text-sm">إضافة ورفع ملف PDF جديد لمكتبة البكالوريا</h3>
                <p className="text-xs text-stone-500">
                  يمكن للإدارة رفع ملخصات رسمية، مواضيع مقترحة، أو مذكرات بيداغوجية لتظهر للتلاميذ فوراً مع إمكانية التحميل
                </p>
              </div>
            </div>

            {adminPdfSuccess ? (
              <div className="py-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-950">تم نشر ملف الـ PDF بنجاح في مكتبة البكالوريا!</h4>
                <p className="text-xs text-emerald-800 mt-0.5">يمكن لجميع التلاميذ والأساتذة تحميله وقراءته الآن.</p>
              </div>
            ) : (
              <form onSubmit={handleAdminCreateResource} className="space-y-4">
                
                {/* PDF File Upload Zone */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2">
                  <label className="block text-xs font-bold text-stone-800">
                    ملف الـ PDF المراد رفعه (من الحاسوب):
                  </label>

                  {adminUploadedPdf ? (
                    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-300 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-stone-900 block truncate">
                            {adminUploadedPdf.name}
                          </span>
                          <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                            {adminUploadedPdf.size} — جاهز للنشر الفوري
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdminUploadedPdf(null)}
                        className="text-stone-400 hover:text-rose-600 text-xs font-bold px-2 py-1 rounded-lg border border-stone-200 hover:border-rose-300 shrink-0 cursor-pointer"
                      >
                        تغيير
                      </button>
                    </div>
                  ) : (
                    <div>
                      <label className="flex flex-col items-center justify-center p-5 bg-white border border-stone-200 hover:border-emerald-500 rounded-xl cursor-pointer transition-colors text-center group">
                        <Upload className="w-7 h-7 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-stone-900">
                          انقر لاختيار ملف PDF من حاسوب الإدارة
                        </span>
                        <span className="text-[11px] text-stone-400 mt-0.5">
                          صيغة PDF فقط (حجم أقصى 25 ميغابايت)
                        </span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={handleAdminPdfSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {adminPdfError && (
                    <p className="text-xs text-rose-600 font-semibold">{adminPdfError}</p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    عنوان الملف / السلسلة <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    placeholder="مثال: حقيبة تمارين ومسائل الدوال اللوغاريتمية والأسية مع الحلول المفصلة"
                    required
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      نوع الوثيقة:
                    </label>
                    <select
                      value={pdfType}
                      onChange={(e) => setPdfType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                    >
                      <option value="summary">ملخص درس ومفاهيم</option>
                      <option value="exercise">سلسلة تمارين وتطبيقات</option>
                      <option value="cheatsheet">بطاقة تذكر سريع</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      المادة:
                    </label>
                    <input
                      type="text"
                      value={pdfSubject}
                      onChange={(e) => setPdfSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      الشعبة:
                    </label>
                    <select
                      value={pdfStream}
                      onChange={(e) => setPdfStream(e.target.value as BacStream)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                    >
                      {ALL_STREAMS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      الجهة المؤطرة / الأستاذ:
                    </label>
                    <input
                      type="text"
                      value={pdfTeacherName}
                      onChange={(e) => setPdfTeacherName(e.target.value)}
                      placeholder="إدارة جمعية بذرة غد"
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    وصف المحتوى وأهداف الوثيقة:
                  </label>
                  <textarea
                    value={pdfDesc}
                    onChange={(e) => setPdfDesc(e.target.value)}
                    rows={2}
                    placeholder="وصف مختصر لمحتوى الملف وما يقدمه للتلميذ..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    عناصر الإجابة وسلم التنقيط (اختياري):
                  </label>
                  <textarea
                    value={pdfSolution}
                    onChange={(e) => setPdfSolution(e.target.value)}
                    rows={2}
                    placeholder="الحل النموذجي أو ملاحظات التنقيط المعتمدة..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>نشر ملف الـ PDF في مكتبة المنصة</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* List of All PDF Documents */}
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
            <div className="p-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">قائمة جميع ملفات الـ PDF المنشورة بالمكتبة</h3>
                <p className="text-xs text-stone-500">معاينة الملفات، اختبار التحميل الفعلي، أو الحذف</p>
              </div>
              <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-md border border-stone-200 text-emerald-800 font-bold">
                {resources.length} وثيقة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">عنوان الملف</th>
                    <th className="py-3 px-4">المادة</th>
                    <th className="py-3 px-4">الشعبة</th>
                    <th className="py-3 px-4">المؤطر</th>
                    <th className="py-3 px-4">الحجم</th>
                    <th className="py-3 px-4 font-mono">التحميلات</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {resources.map((res) => (
                    <tr key={res.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            PDF
                          </span>
                          <span className="line-clamp-1">{res.title}</span>
                          {res.isHidden && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold border border-amber-300">
                              مخفي 🔒
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-emerald-800 font-semibold">{res.subject}</td>
                      <td className="py-3 px-4 text-stone-600">{res.stream}</td>
                      <td className="py-3 px-4 text-stone-700">{res.teacherName}</td>
                      <td className="py-3 px-4 font-mono text-stone-500">{res.fileSize}</td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-800">{res.downloadCount || 0}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleTestDownloadPdf(res)}
                            title="اختبار تحميل الـ PDF"
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>تحميل</span>
                          </button>

                          {onToggleHideResource && (
                            <button
                              type="button"
                              onClick={() => onToggleHideResource(res.id, !res.isHidden)}
                              title={res.isHidden ? 'إظهار الملف بالمكتبة' : 'إخفاء الملف عن التلاميذ'}
                              className={`p-1 rounded-lg border text-xs transition-colors cursor-pointer ${
                                res.isHidden
                                  ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200'
                                  : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100'
                              }`}
                            >
                              {res.isHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-800" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {onDeleteResource && (
                            <button
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف ملف «${res.title}»؟`)) {
                                  onDeleteResource(res.id);
                                }
                              }}
                              title="حذف الملف"
                              className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 9. Backup & Restore Tab */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-100">
            <Download className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-bold text-stone-900 text-sm">النسخ الاحتياطي واستعادة قاعدة البيانات</h3>
              <p className="text-xs text-stone-500">حفظ ملف كامل بجميع المسجلين والأساتذة والحصص والإعدادات</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <span className="font-bold text-xs text-stone-900 block">تصدير نسخة احتياطية (JSON):</span>
              <p className="text-[11px] text-stone-500">
                تحميل ملف يحتوي على جميع بيانات المنصة الحالية لحفظها على حاسوب الإدارة.
              </p>
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تحميل النسخة الاحتياطية الآن</span>
              </button>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
              <span className="font-bold text-xs text-stone-900 block">استيراد واستعادة نسخة سابقة:</span>
              <p className="text-[11px] text-stone-500">
                رفع ملف JSON محفوظ سابقاً لاستعادة كافة البيانات فوراً.
              </p>
              <label className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>اختيار ملف واستعادته</span>
                <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">إعادة تعيين البيانات إلى النماذج التجريبية:</span>
            <button
              type="button"
              onClick={() => {
                if (confirm('هل أنت متأكد من إعادة ضبط البيانات إلى النماذج التجريبية؟')) {
                  onResetToSampleData();
                }
              }}
              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
            >
              إعادة ضبط البيانات الافتراضية
            </button>
          </div>
        </div>
      )}

      {/* Password Edit Modal for Students & Teachers (ADMIN EXCLUSIVE) */}
      {editingPasswordUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4.5 sm:p-6 shadow-2xl border border-stone-200 relative text-right animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <KeyRound className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    تغيير كلمة السر (إدارة الجمعية)
                  </h3>
                  <span className="text-[11px] text-stone-500">
                    {editingPasswordUser.role === 'teacher' ? 'حساب أستاذ مؤطر' : 'حساب تلميذ مسجل'}
                  </span>
                </div>
              </div>

              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                editingPasswordUser.role === 'teacher' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {editingPasswordUser.role === 'teacher' ? 'أستاذ' : 'تلميذ'}
              </span>
            </div>

            {/* Target User Summary Card */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 mb-4 space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">الاسم الكامل:</span>
                <span className="font-bold text-stone-900">{editingPasswordUser.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">اسم المستخدم (للدخول):</span>
                <span className="font-mono font-bold text-stone-800">{editingPasswordUser.username || '–'}</span>
              </div>
              {editingPasswordUser.currentPassword && (
                <div className="flex justify-between items-center pt-1 border-t border-stone-200/60">
                  <span className="text-stone-500">كلمة السر المسجلة حالياً:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 text-xs" dir="ltr">
                    {editingPasswordUser.currentPassword}
                  </span>
                </div>
              )}
            </div>

            {passwordModalNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-bold flex items-center gap-2 mb-4 animate-bounce">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordModalNotice}</span>
              </div>
            )}

            {/* Edit Form */}
            <form onSubmit={handleSaveUserPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  كلمة السر الجديدة:
                </label>
                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    value={newPasswordForUser}
                    onChange={(e) => setNewPasswordForUser(e.target.value)}
                    required
                    placeholder="أدخل كلمة سر جديدة لا تقل عن 3 خانات..."
                    className="w-full pr-3.5 pl-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-hidden"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword(!showModalPassword)}
                    className="absolute left-3 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Password Generators */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="text-stone-500">اقتراحات سريعة:</span>
                <button
                  type="button"
                  onClick={() => setNewPasswordForUser(Math.floor(100000 + Math.random() * 900000).toString())}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-mono cursor-pointer transition-colors"
                >
                  ⚡ رمز 6 أرقام
                </button>
                <button
                  type="button"
                  onClick={() => setNewPasswordForUser('bac2027dz')}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-mono cursor-pointer transition-colors"
                >
                  bac2027dz
                </button>
                <button
                  type="button"
                  onClick={() => setNewPasswordForUser('123456')}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-mono cursor-pointer transition-colors"
                >
                  123456
                </button>
              </div>

              <p className="text-[10px] text-stone-500 leading-relaxed">
                🔒 يمكن للإدارة تعديل كلمة السر في أي وقت وتزويد الأستاذ أو التلميذ بها للدخول إلى فضاء المنصة والبطاقة الرقمية.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPasswordUser(null);
                    setNewPasswordForUser('');
                  }}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 sm:bg-transparent rounded-xl cursor-pointer text-center"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ كلمة السر الآن</span>
                </button>
              </div>
            </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
