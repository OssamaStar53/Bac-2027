import React, { useState, useEffect } from 'react';
import { SupportSession, Teacher, BacStream, AppUser, SiteSettings } from '../types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Share2, 
  CheckCircle2, 
  Filter, 
  Search, 
  Sparkles, 
  Lock, 
  LogIn, 
  UserPlus, 
  QrCode, 
  Users, 
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Layers,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Trash2,
  EyeOff,
  Eye,
  CalendarPlus,
  X
} from 'lucide-react';

interface ScheduleViewProps {
  sessions: SupportSession[];
  teachers: Teacher[];
  currentUser: AppUser | null;
  siteSettings?: SiteSettings;
  onOpenTeacherSpace: () => void;
  onOpenRegister: () => void;
  onOpenAuth: () => void;
  onAddSession?: (session: SupportSession) => void;
  onDeleteSession?: (sessionId: string) => void;
  onToggleHideSession?: (sessionId: string) => void;
}

const ALL_STREAMS: (BacStream | 'الكل')[] = [
  'الكل',
  'السنة الرابعة متوسط (BEM)',
  'علوم تجريبية',
  'رياضيات',
  'تقني رياضي',
  'تسيير واقتصاد',
  'آداب وفلسفة',
  'لغات أجنبية',
];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  sessions,
  teachers,
  currentUser,
  siteSettings,
  onOpenTeacherSpace,
  onOpenRegister,
  onOpenAuth,
  onAddSession,
  onDeleteSession,
  onToggleHideSession,
}) => {
  const isManager = currentUser?.role === 'teacher' || currentUser?.role === 'association_admin';

  // Add Session Modal State (mobile and desktop friendly)
  const [isAddSessionOpen, setIsAddSessionOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('الرياضيات');
  const [newLevel, setNewLevel] = useState<'BAC' | 'BEM'>('BAC');
  const [newStream, setNewStream] = useState<BacStream>('علوم تجريبية');
  const [newTeacherName, setNewTeacherName] = useState(currentUser?.fullName || (teachers[0]?.fullName || 'أستاذ متطوع'));
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newTimeText, setNewTimeText] = useState('الجمعة بعد صلاة المغرب (18:30 - 20:00)');
  const [newLocation, setNewLocation] = useState('دار الشباب الشهيد بوجمعة - قاعة المحاضرات');
  const [newDescription, setNewDescription] = useState('');
  const [showRoleNoticeModal, setShowRoleNoticeModal] = useState(false);

  const isTeacherOrAdmin = Boolean(
    currentUser && (currentUser.role === 'teacher' || currentUser.role === 'association_admin')
  );

  const handleOpenAddSession = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (currentUser.role !== 'teacher' && currentUser.role !== 'association_admin') {
      setShowRoleNoticeModal(true);
      return;
    }
    setIsAddSessionOpen(true);
  };

  const handleCreateSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const teacherObj = teachers.find(t => t.fullName === newTeacherName) || teachers[0];

    const sessionObj: SupportSession = {
      id: `ses-${Date.now().toString().slice(-4)}`,
      title: newTitle.trim(),
      subject: newSubject,
      stream: newStream,
      educationLevel: newLevel,
      teacherId: teacherObj?.id || currentUser?.relatedId || 'tch-001',
      teacherName: newTeacherName.trim(),
      date: newDate,
      timeText: newTimeText.trim(),
      location: newLocation.trim(),
      description: newDescription.trim() || 'حصة دعم ومراجعة بيداغوجية مكثفة.',
      completed: false,
      attendance: {},
    };

    if (onAddSession) {
      onAddSession(sessionObj);
    }
    setIsAddSessionOpen(false);
    setNewTitle('');
    setNewDescription('');
  };

  // If student is logged in, default stream filter to their enrolled stream
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'BAC' | 'BEM'>('all');
  const [selectedStream, setSelectedStream] = useState<BacStream | 'الكل'>('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [registeredSessions, setRegisteredSessions] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('badhra_booked_sessions');
    return saved ? JSON.parse(saved) : {};
  });
  const [activeSessionPass, setActiveSessionPass] = useState<SupportSession | null>(null);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

  // Sync auto-stream filter when user logs in as student
  useEffect(() => {
    if (currentUser?.role === 'student' && currentUser.stream) {
      setSelectedStream(currentUser.stream);
      if (currentUser.stream.includes('BEM')) {
        setSelectedLevel('BEM');
      } else {
        setSelectedLevel('BAC');
      }
    }
  }, [currentUser]);

  // Persist seat reservations
  useEffect(() => {
    localStorage.setItem('badhra_booked_sessions', JSON.stringify(registeredSessions));
  }, [registeredSessions]);

  const filteredSessions = sessions.filter((session) => {
    // Hide hidden sessions from regular students
    if (!isManager && session.isHidden) return false;

    const isBemSession = session.stream.includes('BEM') || session.educationLevel === 'BEM';
    const matchLevel = 
      selectedLevel === 'all' || 
      (selectedLevel === 'BEM' && isBemSession) ||
      (selectedLevel === 'BAC' && !isBemSession);

    const matchStream = selectedStream === 'الكل' || session.stream === selectedStream;
    const matchSearch = 
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLevel && matchStream && matchSearch;
  });

  const handleRSVP = (sessionId: string) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setRegisteredSessions((prev) => ({
      ...prev,
      [sessionId]: !prev[sessionId],
    }));
  };

  const handleShareSession = (s: SupportSession) => {
    const text = encodeURIComponent(
      `🔔 *تذكير بحصة دعم مجانية - بذرة غد*\n` +
      `📚 *المادة:* ${s.subject} (${s.stream})\n` +
      `🎯 *الموضوع:* ${s.title}\n` +
      `⏰ *الموعد:* ${currentUser ? s.timeText : 'متاح للمسجلين عبر المنصة'}\n` +
      `📍 *المقر:* دار الشباب الشهيد بوجمعة\n\n` +
      `سجل دخولك عبر المنصة لحجز مقعدك: https://badhrat-ghad.dz`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Top Gating Status Banner */}
      {!currentUser ? (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-amber-950 block text-sm">
                معلومات الحصص الدقيقة (القاعات، التوقيت، وحجز المقاعد) متاحة للمسجلين فقط
              </span>
              <span className="text-amber-800">
                يرجى تسجيل الدخول بحسابك أو إنشاء حساب تلميذ جديد لعرض التفاصيل الكاملة وحجز مقعدك بدار الشباب.
              </span>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors text-center flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>تسجيل الدخول للمتابعة</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-950">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              أنت مسجل حالياً كـ <b>{currentUser.fullName}</b> ({currentUser.role === 'student' ? 'تلميذ' : currentUser.role === 'teacher' ? 'أستاذ متطوع' : 'إدارة الجمعية'}). 
              <span className="text-emerald-800 mr-1.5 font-medium">جلسة الدخول محفوظة بشكل دائم على هذا الجهاز.</span>
            </span>
          </div>

          <button
            onClick={() => setShowSuggestionsModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-300 text-emerald-900 rounded-lg font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>مقترحات وتطويرات المنصة</span>
          </button>
        </div>
      )}

      {/* Hero Banner with Baccalaureate 2027 Ambition & Countdown */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 mb-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-lg text-emerald-200 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>مبادرة جمعوية مجانية بدار الشباب لمرافقة نخب الغد</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            برنامج حصص الدعم والمرافقة <br />
            <span className="text-emerald-300">«بذرة غد – بكالوريا 2027 & تعليم متوسط BEM»</span>
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 mt-3 leading-relaxed">
            حصص أسبوعية مجانية يقدمها أساتذة متطوعون ذوو خبرة في جميع الشعب والمواد الأساسية لطور البكالوريا (السنة 3 ثانوي) وطور التعليم المتوسط (السنة 4 متوسط BEM)، مدعمة بحوليات سابقة واختبارات مصححة آلياً وبطاقة متابعة رقمية لكل تلميذ.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {!currentUser ? (
              <button
                onClick={onOpenAuth}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-emerald-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>دخول المنصة وحجز المقاعد</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs bg-white/15 px-3 py-1.5 rounded-lg border border-white/20">
                  مرحباً بك: <b>{currentUser.fullName}</b>
                </span>
                {(currentUser.role === 'teacher' || currentUser.role === 'association_admin') && (
                  <button
                    onClick={handleOpenAddSession}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CalendarPlus className="w-4 h-4 text-stone-900" />
                    <span>+ إضافة حصة دعم جديدة</span>
                  </button>
                )}
                {currentUser.role === 'teacher' && (
                  <button
                    onClick={onOpenTeacherSpace}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs rounded-xl"
                  >
                    الانتقال لفضاء الأستاذ
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bac 2027 Countdown Badge */}
        <div className="mt-6 lg:mt-0 lg:absolute lg:left-8 lg:bottom-8 bg-emerald-950/80 border border-emerald-700/60 p-4 rounded-2xl backdrop-blur-md text-center max-w-xs">
          <span className="text-[10px] text-emerald-300 font-bold block mb-1">
            الهدف الأسمى: شهادة البكالوريا
          </span>
          <div className="text-xl font-mono font-black text-amber-300">
            جوان 2027 🎯
          </div>
          <p className="text-[11px] text-emerald-200 mt-1">
            «من سار على الدرب وصل.. غايتنا الامتياز بتفوق»
          </p>
        </div>
      </div>

      {/* Level Tabs and Stream / Search Filter Bar */}
      <div className="space-y-3 mb-8">
        
        {/* Level Toggle Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-stone-200/60 rounded-2xl max-w-md">
          <button
            onClick={() => { setSelectedLevel('all'); setSelectedStream('الكل'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              selectedLevel === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            جميع المستويات
          </button>
          <button
            onClick={() => { setSelectedLevel('BAC'); setSelectedStream('الكل'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedLevel === 'BAC'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>بكالوريا (BAC)</span>
          </button>
          <button
            onClick={() => { setSelectedLevel('BEM'); setSelectedStream('السنة الرابعة متوسط (BEM)'); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedLevel === 'BEM'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>تعليم متوسط (BEM)</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Stream Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            {ALL_STREAMS
              .filter((str) => {
                if (selectedLevel === 'BEM') return str === 'الكل' || str.includes('BEM');
                if (selectedLevel === 'BAC') return str !== 'السنة الرابعة متوسط (BEM)';
                return true;
              })
              .map((str) => (
                <button
                  key={str}
                  onClick={() => setSelectedStream(str)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedStream === str
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {str}
                  {currentUser?.role === 'student' && currentUser.stream === str && (
                    <span className="mr-1 text-[10px] text-emerald-200">★ شعبتك</span>
                  )}
                </button>
              ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-auto md:min-w-[240px]">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مادة، أستاذ، أو عنوان الدرس..."
              className="w-full pr-9 pl-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
            />
          </div>

        </div>
      </div>

      {/* Sessions Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 mb-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-stone-700">الحصص المبرمجة ({filteredSessions.length})</span>
            <span>· المقر: دار الشباب الشهيد بوجمعة</span>
          </div>

          {isTeacherOrAdmin && (
            <button
              onClick={handleOpenAddSession}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-amber-300" />
              <span>+ إضافة حصة دعم جديدة</span>
            </button>
          )}
        </div>

        {filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="font-semibold text-sm">لا توجد حصص مبرمجة مطابقة لبحثك.</p>
            <p className="text-xs text-stone-400 mt-1">جرب تغيير الشعبة أو مسح نص البحث.</p>
          </div>
        ) : (
          filteredSessions.map((session, index) => {
            const isRSVP = registeredSessions[session.id];
            // Simulated seat capacity
            const bookedSeats = 24 + ((index * 3) % 10);
            const totalSeats = 35;

            return (
              <div
                key={session.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden"
              >
                {/* Session Details */}
                <div className="space-y-2.5 max-w-2xl flex-1">
                  
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {(session.stream.includes('BEM') || session.educationLevel === 'BEM') ? (
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-amber-700" />
                        <span>شهادة التعليم المتوسط (BEM)</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded-md font-bold text-[10px] flex items-center gap-1">
                        <GraduationCap className="w-3 h-3 text-emerald-700" />
                        <span>بكالوريا 2027</span>
                      </span>
                    )}

                    <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                      {session.subject}
                    </span>
                    <span className="bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-md font-medium">
                      {session.stream}
                    </span>
                    {session.completed ? (
                      <span className="text-[11px] text-stone-400">● حصة منجزة</span>
                    ) : (
                      <span className="text-[11px] text-emerald-600 font-bold">● حصة قادمة</span>
                    )}

                    {/* Seat capacity badge (visible for registered users) */}
                    {currentUser && (
                      <span className="text-[11px] font-mono text-stone-500 bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
                        🪑 المقاعد: <b className="text-emerald-800">{bookedSeats}</b> / {totalSeats}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
                    {session.title}
                  </h3>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {session.description}
                  </p>

                  {/* GATED METADATA: Visible to registered users only */}
                  {currentUser ? (
                    <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-1">
                      <div className="flex items-center gap-1.5 font-semibold text-stone-800">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{session.teacherName}</span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-emerald-900 bg-emerald-50/80 px-2.5 py-1 rounded-md font-bold">
                        <Clock className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{session.timeText}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-stone-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{session.location}</span>
                      </div>

                      {session.attachedResourceTitle && (
                        <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-medium">
                          <FileText className="w-3.5 h-3.5" />
                          <span>ملف مرفق: {session.attachedResourceTitle}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Locked Metadata View for Unregistered Guests */
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs space-y-2">
                      <div className="flex items-center justify-between text-stone-500">
                        <span className="flex items-center gap-1.5 font-semibold text-stone-700">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>معلومات القاعة والتوقيت الدقيق محجوبة للمسجلين:</span>
                        </span>
                        <span className="text-[11px] text-amber-700 font-bold bg-amber-100/60 px-2 py-0.5 rounded-md">
                          مطلوب تسجيل الدخول
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-stone-500 blur-xs select-none">
                        <span>⏰ الخميس 17:30 (بعد صلاة المغرب)</span>
                        <span>📍 دار الشباب - القاعة الكبرى 1</span>
                        <span>👨‍🏫 الأستاذ المؤطر المعتمد</span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Actions */}
                <div className="flex md:flex-col items-center justify-end gap-2 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100">
                  {currentUser ? (
                    <>
                      <button
                        onClick={() => handleRSVP(session.id)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          isRSVP
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRSVP ? 'أنت مسجل في الحصة ✓' : 'حجز مقعد في الحصة'}</span>
                      </button>

                      {isRSVP && (
                        <button
                          onClick={() => setActiveSessionPass(session)}
                          className="w-full sm:w-auto px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>بطاقة الدخول QR</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleShareSession(session)}
                        className="w-full sm:w-auto px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        title="مشاركة مع الزملاء"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>مشاركة التذكير</span>
                      </button>

                      {/* Hide / Unhide Session action: for Association Admin or Session Teacher only */}
                      {(currentUser.role === 'association_admin' || (currentUser.role === 'teacher' && (session.teacherId === currentUser.relatedId || !session.teacherId))) && onToggleHideSession && (
                        <button
                          onClick={() => onToggleHideSession(session.id)}
                          className={`w-full sm:w-auto px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                            session.isHidden
                              ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                              : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                          }`}
                          title={session.isHidden ? 'إلغاء الإخفاء وإظهار الحصة' : 'إخفاء الحصة عن التلاميذ'}
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>{session.isHidden ? 'إظهار الحصة' : 'إخفاء الحصة'}</span>
                        </button>
                      )}

                      {/* Delete Session action: for Association Admin or Session Teacher only */}
                      {(currentUser.role === 'association_admin' || (currentUser.role === 'teacher' && (session.teacherId === currentUser.relatedId || !session.teacherId))) && onDeleteSession && (
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من رغبتك في حذف وإلغاء حصة "${session.title}"؟`)) {
                              onDeleteSession(session.id);
                            }
                          }}
                          className="w-full sm:w-auto px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          title="إلغاء وحذف الحصة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف الحصة</span>
                        </button>
                      )}
                    </>
                  ) : (
                    /* Guest Call-To-Action */
                    <button
                      onClick={onOpenAuth}
                      className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>دخول لرؤية القاعة وحجز المقعد</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Digital QR Entry Pass Modal for Booked Session */}
      {activeSessionPass && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 text-center shadow-2xl border border-stone-200 relative">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-7 h-7" />
            </div>

            <h3 className="font-extrabold text-stone-900 text-base">بطاقة الدخول الرقمية للحصة</h3>
            <p className="text-xs text-stone-500 mt-1">«بذرة غد – دار الشباب الشهيد بوجمعة»</p>

            <div className="p-4 bg-stone-50 rounded-2xl my-4 text-xs text-right space-y-2 border border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">التلميذ:</span>
                <span className="font-bold text-stone-900">{currentUser?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">المادة:</span>
                <span className="font-bold text-emerald-800">{activeSessionPass.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">التوقيت:</span>
                <span className="font-mono font-bold text-stone-900">{activeSessionPass.timeText}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">المقر:</span>
                <span className="font-semibold text-stone-800">{activeSessionPass.location}</span>
              </div>
            </div>

            {/* Simulated QR graphic */}
            <div className="w-36 h-36 mx-auto bg-stone-900 text-white rounded-xl p-2 flex flex-col items-center justify-center">
              <QrCode className="w-28 h-28 text-white" />
            </div>
            <span className="text-[10px] text-stone-400 block mt-2 font-mono">
              PASS-{activeSessionPass.id}-{currentUser?.id}
            </span>

            <button
              onClick={() => setActiveSessionPass(null)}
              className="mt-5 w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              إغلاق البطاقة
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions and Roadmap Modal */}
      {showSuggestionsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="min-h-full flex items-center justify-center py-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4.5 sm:p-6 text-right shadow-2xl border border-stone-200 relative">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-100 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">مقترحات وتطويرات مميزة لمنصة «بذرة غد»</h3>
                <p className="text-xs text-stone-500">أفكار مبتكرة تم تفعيلها لتعزيز كفاءة المبادرة الجمعوية</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-stone-700 max-h-96 overflow-y-auto pr-1">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-0.5">1. قفل المعلومات الحساسة للمسجلين (تم تفعيله):</span>
                <p className="text-[11px] text-emerald-800">
                  حجب قاعات دار الشباب وتفاصيل المذكرات عن الزوار لحثهم على التسجيل الرسمي ومنع الاكتظاظ العشوائي.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-0.5">2. نظام البقاء مسجلاً الدائم (Remember Me):</span>
                <p className="text-[11px] text-stone-600">
                  تخزين مشفر ومستمر للجلسة على المتصفح حتى لا يضطر التلميذ أو الأستاذ لإعادة كتابة كلمة السر في كل زيارة.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-0.5">3. بطاقة المرور الرقمية QR للحصة:</span>
                <p className="text-[11px] text-stone-600">
                  توليد تذكرة حضور فورية على هاتف التلميذ لمسحها عند باب دار الشباب من طرف المشرفين لتسجيل الحضور في ثوانٍ.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-0.5">4. تصفية الحصص حسب شعبة التلميذ تلقائياً:</span>
                <p className="text-[11px] text-stone-600">
                  بمجرد دخول التلميذ بشعبة (مثلاً علوم تجريبية)، تظهر له فوراً حصصه المعنية دون تشتيت.
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-0.5">5. عداد المقاعد المتاحة (Seat Capacity):</span>
                <p className="text-[11px] text-stone-600">
                  إظهار عدد المقاعد المتبقية في القاعة (مثلاً 28 / 35) لتشجيع التلاميذ على الانضباط والحجز المسبق.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSuggestionsModal(false)}
              className="mt-5 w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              تم، العودة إلى البرنامج
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Session Action Button on Mobile (Teachers & Admin ONLY) */}
      {isTeacherOrAdmin && (
        <div className="md:hidden fixed bottom-6 left-5 z-40">
          <button
            onClick={handleOpenAddSession}
            className="flex items-center gap-2 px-4.5 py-3.5 bg-emerald-800 hover:bg-emerald-900 active:bg-emerald-950 text-white font-black text-xs rounded-full shadow-2xl border-2 border-emerald-400 cursor-pointer"
            title="إضافة حصة دعم جديدة"
          >
            <CalendarPlus className="w-5 h-5 text-amber-300" />
            <span>إضافة حصة</span>
          </button>
        </div>
      )}

      {/* Role Notice Modal when student attempts to add session */}
      {showRoleNoticeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs p-3 sm:p-6 flex flex-col justify-start sm:justify-center items-center py-6">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-center space-y-4 my-auto">
            <div className="w-14 h-14 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
              <CalendarPlus className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">برمجة الحصص مخصصة للأساتذة والإدارة</h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                حسابك الحالي مسجل كـ <b>تلميذ</b>. إضافة وتعديل حصص الدعم وتحديد التوقيت متاح حصرياً للأساتذة المؤطرين المتطوعين وإدارة جمعية بذرة غد.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setShowRoleNoticeModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl cursor-pointer"
              >
                فهمت، العودة للجدول
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRoleNoticeModal(false);
                  onOpenAuth();
                }}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl cursor-pointer"
              >
                دخول كأستاذ أو إدارة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-Friendly Add Session Modal Dialog */}
      {isAddSessionOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs p-2.5 sm:p-4 flex flex-col justify-start sm:justify-center items-center py-4 sm:py-8">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4.5 sm:p-7 shadow-2xl border border-stone-200 relative text-right modal-scrollable max-h-[92dvh] overflow-y-auto">
            
            <button
              onClick={() => setIsAddSessionOpen(false)}
              className="absolute left-4 top-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer z-10"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5 pb-3 border-b border-stone-100">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <CalendarPlus className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">برمجة حصة دعم جديدة</h3>
                <p className="text-xs text-stone-500">حدد بيانات الحصة لنشرها بدار الشباب وبثها تلقائياً</p>
              </div>
            </div>

            <form onSubmit={handleCreateSessionSubmit} className="space-y-3.5">
              
              {/* Level Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  الطور التعليمي <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setNewLevel('BAC'); setNewStream('علوم تجريبية'); }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newLevel === 'BAC'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>بكالوريا (BAC)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setNewLevel('BEM'); setNewStream('السنة الرابعة متوسط (BEM)'); }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      newLevel === 'BEM'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>تعليم متوسط (BEM)</span>
                  </button>
                </div>
              </div>

              {/* Title / Topic */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  عنوان الحصة أو موضوع الدرس <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: مراجعة شاملة في الدوال الأسية وتمارين نموذجية"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600 font-medium"
                />
              </div>

              {/* Subject & Stream */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المادة:</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden font-medium"
                  >
                    <option value="الرياضيات">الرياضيات</option>
                    <option value="العلوم الفيزيائية">العلوم الفيزيائية</option>
                    <option value="علوم الطبيعة والحياة">علوم الطبيعة والحياة</option>
                    <option value="اللغة العربية وآدابها">اللغة العربية وآدابها</option>
                    <option value="الفلسفة">الفلسفة</option>
                    <option value="التاريخ والجغرافيا">التاريخ والجغرافيا</option>
                    <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                    <option value="اللغة الفرنسية">اللغة الفرنسية</option>
                    <option value="العلوم الإسلامية">العلوم الإسلامية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">الشعبة المستهدفة:</label>
                  <select
                    value={newStream}
                    onChange={(e) => setNewStream(e.target.value as BacStream)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden font-medium"
                  >
                    {newLevel === 'BEM' ? (
                      <option value="السنة الرابعة متوسط (BEM)">السنة الرابعة متوسط (BEM)</option>
                    ) : (
                      <>
                        <option value="علوم تجريبية">علوم تجريبية</option>
                        <option value="رياضيات">رياضيات</option>
                        <option value="تقني رياضي">تقني رياضي</option>
                        <option value="تسيير واقتصاد">تسيير واقتصاد</option>
                        <option value="آداب وفلسفة">آداب وفلسفة</option>
                        <option value="لغات أجنبية">لغات أجنبية</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Teacher & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">الأستاذ المؤطر:</label>
                  <input
                    type="text"
                    value={newTeacherName}
                    onChange={(e) => setNewTeacherName(e.target.value)}
                    placeholder="اسم الأستاذ"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">التاريخ:</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden font-medium font-mono"
                  />
                </div>
              </div>

              {/* Time text & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">التوقيت بالتفصيل:</label>
                  <input
                    type="text"
                    value={newTimeText}
                    onChange={(e) => setNewTimeText(e.target.value)}
                    placeholder="الجمعة بعد صلاة المغرب (18:30 - 20:00)"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">المقر والقاعة:</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="دار الشباب الشهيد بوجمعة"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">ملاحظات ومحاور الحصة (اختياري):</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="ملاحظات حول الأدوات المطلوبة أو السلسلة المعالجة..."
                  rows={2}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden font-medium"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-2"
                >
                  <CalendarPlus className="w-4 h-4 text-amber-300" />
                  <span>تأكيد برمجة الحصة ونشرها</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddSessionOpen(false)}
                  className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
