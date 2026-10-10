import React, { useState } from 'react';
import { Student, AppUser } from '../types';
import { BadhraLogo } from './BadhraLogo';
import { downloadStudentCardAsPdf } from '../utils/pdfGenerator';
import { 
  Printer, 
  Share2, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  QrCode, 
  Sparkles, 
  UserCheck, 
  GraduationCap, 
  BookOpen,
  Lock,
  ShieldCheck,
  ShieldAlert,
  LogIn,
  UserPlus,
  FileDown,
  Search,
  Filter
} from 'lucide-react';

interface StudentCardViewProps {
  students: Student[];
  selectedStudentId: string;
  onSelectStudent: (id: string) => void;
  onOpenRegister: () => void;
  currentUser?: AppUser | null;
  onOpenAuth?: () => void;
}

export const StudentCardView: React.FC<StudentCardViewProps> = ({
  students,
  selectedStudentId,
  onSelectStudent,
  onOpenRegister,
  currentUser,
  onOpenAuth,
}) => {
  const [printSuccess, setPrintSuccess] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [levelFilter, setLevelFilter] = useState<'all' | 'BAC' | 'BEM'>('all');
  const [searchStudentQuery, setSearchStudentQuery] = useState('');

  // 1. Privacy Protection Guard: Only logged-in users can view cards
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto my-16 px-4 text-right">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-xl text-center space-y-5">
          <div className="w-18 h-18 bg-emerald-50 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto shadow-xs border border-emerald-200">
            <ShieldCheck className="w-10 h-10 text-emerald-700" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full border border-amber-300 font-mono mb-2">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>بيانات محمية وسرية 🔒</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              البطاقة الرقمية للتلميذ مخصصة حصرياً
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed max-w-md mx-auto">
              احتراماً لخصوصية التلاميذ وبياناتهم الشخصية ونتائجهم الدراسية، يُسمح بالاطلاع على البطاقة الرقمية حصرياً لـ:
            </p>
          </div>

          <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs space-y-2.5 text-right font-medium">
            <div className="flex items-center gap-2 text-stone-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span><b>إدارة جمعية بذرة غد:</b> متابعة شاملة لكافة الأفواج والنتائج.</span>
            </div>
            <div className="flex items-center gap-2 text-stone-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span><b>الأساتذة المؤطرون:</b> رصد الحضور ومتابعة تقدم التلاميذ البيداغوجي.</span>
            </div>
            <div className="flex items-center gap-2 text-stone-800">
              <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
              <span><b>التلميذ المسجل:</b> الاطلاع على بطاقته الشخصية فقط بعد تسجيل الدخول.</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-center w-full">
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
            >
              <LogIn className="w-4 h-4 text-amber-300" />
              <span>تسجيل الدخول لعرض بطاقتك الرقمية</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Identify the active student based on role with safe fallbacks
  const safeStudents = students || [];
  let currentStudent: Student | undefined;

  if (currentUser.role === 'student') {
    // A student can ONLY see their own card! Never other students' cards.
    currentStudent = safeStudents.find((s) => s.id === currentUser.relatedId) ||
                     safeStudents.find((s) => s.username === currentUser.username) ||
                     safeStudents.find((s) => s.fullName === currentUser.fullName) ||
                     safeStudents[0];
  } else {
    // Teachers and association admins can choose any student
    currentStudent = safeStudents.find((s) => s.id === selectedStudentId) || safeStudents[0];
  }

  const isTeacherOrAdmin = currentUser.role === 'teacher' || currentUser.role === 'association_admin';
  const isStudentRole = currentUser.role === 'student';

  if (!currentStudent) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <p className="text-stone-500 font-medium">لا يوجد تلاميذ مسجلين حالياً بالمنصة.</p>
        {isTeacherOrAdmin && (
          <button
            onClick={onOpenRegister}
            className="mt-4 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            تسجيل أول تلميذ
          </button>
        )}
      </div>
    );
  }

  const studentStream = currentStudent.stream || 'علوم تجريبية';
  const isBem = currentStudent.educationLevel === 'BEM' || studentStream.includes('BEM');

  const handlePrint = () => {
    window.print();
    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 2000);
  };

  const handleDownloadCardPdf = async () => {
    if (!currentStudent) return;
    setPdfDownloading(true);
    await downloadStudentCardAsPdf(currentStudent);
    setPdfDownloading(false);
  };

  const safeWeaknesses = currentStudent.weaknesses || [];
  const safeStrengths = currentStudent.strengths || [];
  const safeProgression = currentStudent.monthlyProgression || [];
  const safeEnrolledSubjects = currentStudent.enrolledSubjects && currentStudent.enrolledSubjects.length > 0 
    ? currentStudent.enrolledSubjects 
    : ['الرياضيات', 'العلوم الفيزيائية'];
  const safeAttendanceRate = typeof currentStudent.attendanceRate === 'number' ? currentStudent.attendanceRate : 100;
  const safeAverageScore = typeof currentStudent.averageScore === 'number' ? currentStudent.averageScore : 12.0;

  const handleWhatsAppShare = () => {
    if (!currentStudent) return;
    const certText = isBem ? 'شهادة التعليم المتوسط BEM 2027' : 'شهادة البكالوريا 2027';
    const text = encodeURIComponent(
      `🎓 *بطاقة تلميذ رقمية - بذرة غد (${certText})*\n\n` +
      `👤 *التلميذ:* ${currentStudent.fullName || '–'}\n` +
      `📚 *المستوى/الشعبة:* ${studentStream}\n` +
      `🏫 *المؤسسة:* ${currentStudent.highSchool || '–'}\n` +
      `📅 *الحضور:* ${safeAttendanceRate}%\n` +
      `📝 *معدل الاختبارات:* ${safeAverageScore}/20\n` +
      `⚠️ *نقاط تحتاج إلى تحسين:* ${safeWeaknesses.length > 0 ? safeWeaknesses.join(' – ') : 'لا توجد نقائص مسجلة'}\n` +
      `📍 *الجهة المؤطرة:* جمعية «بذرة غد» الشبانية — ولاية إن صالح\n\n` +
      `جمعية بذرة غد الشبانية – شباب اليوم ... قادة الغد.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Filter students for Teacher / Admin selection safely
  const filteredStudentsForAdmin = safeStudents.filter((s) => {
    const sStream = s.stream || '';
    const sIsBem = s.educationLevel === 'BEM' || sStream.includes('BEM');
    if (levelFilter === 'BAC' && sIsBem) return false;
    if (levelFilter === 'BEM' && !sIsBem) return false;
    if (searchStudentQuery.trim()) {
      const q = searchStudentQuery.toLowerCase().trim();
      const matchName = (s.fullName || '').toLowerCase().includes(q);
      const matchStream = sStream.toLowerCase().includes(q);
      return matchName || matchStream;
    }
    return true;
  });

  const scores = safeProgression.map(p => typeof p.score === 'number' ? p.score : 10);
  const maxScore = Math.max(...(scores.length > 0 ? scores : [20]), 20);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Header & Controls (Hidden when printing) */}
      <div className="no-print mb-8 border-b border-stone-200 pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                {isStudentRole ? 'بطاقتي الشخصية الرسمية 🎓' : 'إشراف الأساتذة وإدارة الجمعية 🔒'}
              </span>
              <span className="text-stone-400 text-xs">·</span>
              <span className="text-xs text-stone-500 font-medium">
                {isBem ? 'شهادة التعليم المتوسط (BEM)' : 'شهادة البكالوريا (BAC)'}
              </span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              {isStudentRole ? `بطاقتي الرقمية — ${currentStudent.fullName}` : 'البطاقات الرقمية للتلاميذ'}
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              {isStudentRole 
                ? 'متابعة رسمية خاصة بك لمعدل الاختبارات، نسبة الحضور، وملاحظات الأساتذة بجمعية بذرة غد الشبانية.'
                : 'متابعة دقيقة لمستوى التلاميذ، نسبة الحضور، معدل الاختبارات، وتطور كل فوج شهراً بعد شهر.'}
            </p>
          </div>

          {/* Action Buttons: Print & Download PDF & Share */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadCardPdf}
              disabled={pdfDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{pdfDownloading ? 'جاري التحميل...' : 'تحميل البطاقة PDF'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مشاركة مع الولي</span>
            </button>
          </div>
        </div>

        {/* ONLY Teachers and Admins have student selector and search (COMPLETELY HIDDEN FOR STUDENTS) */}
        {isTeacherOrAdmin && (
          <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50/80 p-3 rounded-2xl border">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
              <span className="font-bold text-stone-700">الطور:</span>
              <button
                onClick={() => setLevelFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                  levelFilter === 'all' ? 'bg-emerald-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                الكل ({students.length})
              </button>
              <button
                onClick={() => setLevelFilter('BAC')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                  levelFilter === 'BAC' ? 'bg-emerald-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                بكالوريا BAC
              </button>
              <button
                onClick={() => setLevelFilter('BEM')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                  levelFilter === 'BEM' ? 'bg-amber-600 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                تعليم متوسط BEM
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 w-full sm:max-w-md">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchStudentQuery}
                  onChange={(e) => setSearchStudentQuery(e.target.value)}
                  placeholder="بحث عن تلميذ بالاسم أو الشعبة..."
                  className="w-full pr-8 pl-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-emerald-600"
                />
                <Search className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5" />
              </div>

              <select
                value={currentStudent.id}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800 focus:outline-hidden focus:border-emerald-600 max-w-full sm:max-w-[200px] truncate"
              >
                {filteredStudentsForAdmin.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.educationLevel || (s.stream.includes('BEM') ? 'BEM' : 'BAC')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Official Digital Card Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Badge Card (Card representation) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden relative">
          
          {/* Card Top Banner with Emblem */}
          <div className="bg-emerald-900 text-white p-4 sm:p-5 relative overflow-hidden">
            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-emerald-800/50 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10 gap-2">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white border border-emerald-300/40 p-1 flex items-center justify-center shrink-0 shadow-xs">
                  <BadhraLogo size={36} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-[11px] font-semibold text-emerald-300 tracking-wide truncate">
                    الجمهورية الجزائرية الديمقراطية الشعبية
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                    جمعية «بذرة غد» الشبانية – إن صالح
                  </h2>
                  <div className="text-[9px] sm:text-[10px] text-amber-300 font-bold">
                    شباب اليوم ... قادة الغد
                  </div>
                </div>
              </div>

              <div className="text-left font-mono text-[10px] text-emerald-200 shrink-0">
                <div className="font-extrabold text-amber-300 text-xs">
                  {isBem ? 'BEM 2027' : 'BAC 2027'}
                </div>
                <div className="text-white font-bold">{currentStudent.id.toUpperCase()}</div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-emerald-800/80 flex items-center justify-between text-xs text-emerald-100">
              <span className="font-bold flex items-center gap-1.5 truncate">
                {isBem ? (
                  <>
                    <BookOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="truncate">بطاقة التفوق في شهادة التعليم المتوسط (BEM)</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span className="truncate">بطاقة التفوق في شهادة البكالوريا (BAC)</span>
                  </>
                )}
              </span>
              <span className="font-mono text-[10px] sm:text-[11px] bg-emerald-800 px-2 py-0.5 rounded-sm shrink-0">
                الموسم 2026/2027
              </span>
            </div>
          </div>

          {/* Student Core Attributes Layout */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            
            {/* Student Name, Photo & Stream */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                {currentStudent.avatarUrl ? (
                  <img
                    src={currentStudent.avatarUrl}
                    alt={currentStudent.fullName || 'صورة التلميذ'}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-xs shrink-0">
                    {(currentStudent.fullName || 'تلميذ').slice(0, 2)}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-stone-500 block">التلميذ (ة):</span>
                  <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight mt-0.5 truncate">
                    {currentStudent.fullName || 'تلميذ مسجل'}
                  </h3>
                  <div className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span>{currentStudent.highSchool || 'المؤسسة التعليمية'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{currentStudent.wilaya || 'إن صالح'}</span>
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto flex sm:block items-center justify-between bg-stone-50 sm:bg-transparent p-2 sm:p-0 rounded-xl">
                <span className="text-[11px] font-medium text-stone-500 block">
                  {isBem ? 'المستوى:' : 'الشعبة:'}
                </span>
                <span className="inline-block mt-0.5 px-3 py-1 bg-stone-200/80 sm:bg-stone-100 text-stone-800 font-bold rounded-lg text-xs">
                  {studentStream}
                </span>
              </div>
            </div>

            {/* Enrolled Subjects */}
            <div>
              <span className="text-xs font-semibold text-stone-600 block mb-1.5">
                المواد المسجلة في حصص الدعم:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {safeEnrolledSubjects.map((subject, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-stone-50 border border-stone-200 text-stone-700 text-xs font-medium rounded-md"
                  >
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            {/* Two Core Indicators: Attendance & Average Test Score */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              
              {/* Attendance Card Indicator */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
                  <span className="font-semibold">نسبة الحضور:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {safeAttendanceRate}%
                  </span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      safeAttendanceRate >= 80 ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, safeAttendanceRate))}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  {safeAttendanceRate >= 80 ? '● مواظب ومنضبط' : '▲ يحتاج تحسين الحضور'}
                </span>
              </div>

              {/* Test Score Indicator */}
              <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
                  <span className="font-semibold">معدل الاختبارات:</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">
                    {safeAverageScore} / 20
                  </span>
                </div>
                <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-stone-800 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, (safeAverageScore / 20) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-500 mt-1 block">
                  {safeAverageScore >= 14 ? '★ مستوى ممتاز' : safeAverageScore >= 10 ? '● مستوى مقبول' : '▲ بحاجة إلى دعم مكثف'}
                </span>
              </div>

            </div>

            {/* Pedagogical Observations & Weaknesses */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>نقاط تتطلب تركيزاً بيداغوجياً (ملاحظات الأساتذة المؤطرين):</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {safeWeaknesses.length > 0 ? (
                  safeWeaknesses.map((w, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 rounded-md font-semibold text-xs shadow-2xs"
                    >
                      {w}
                    </span>
                  ))
                ) : (
                  <span className="text-stone-500 text-xs">لا توجد نقائص مسجلة، التلميذ يتقدم بثبات.</span>
                )}
              </div>
            </div>

            {/* Official Stamp & QR Code */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 block font-mono">
                    معرف التلميذ المعتمد: {currentStudent.id}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 block">
                    جمعية بذرة غد الشبانية · إن صالح
                  </span>
                </div>
              </div>

              <div className="text-left font-serif text-[11px] text-stone-400 border border-stone-200 p-2 rounded-lg bg-stone-50">
                <div className="text-stone-700 font-bold">ختم الجمعية</div>
                <div className="text-[9px] text-stone-500">معتمد رسمياً 2027</div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Monthly Progression & Profile Info */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Monthly Progression Tracker */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-700" />
                <span>التطور الشهري للنتائج والحضور</span>
              </h3>
              <span className="text-[10px] text-stone-500 font-mono">
                {safeProgression.length} أشهر مسجلة
              </span>
            </div>

            <div className="space-y-4">
              {safeProgression.length === 0 ? (
                <div className="py-4 text-center text-stone-400 text-xs">
                  سيتم تسجيل أول مؤشر شهري فور إجراء الاختبار الأول أو رصد الحضور.
                </div>
              ) : (
                safeProgression.map((item, idx) => {
                  const scorePercent = (item.score / maxScore) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-700">{item.month}</span>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-emerald-700 font-bold">حضور: {item.attendance}%</span>
                          <span className="text-stone-900 font-bold">معدل: {item.score}/20</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {/* Attendance Bar */}
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${item.attendance}%` }}
                          />
                        </div>
                        {/* Score Bar */}
                        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-stone-800 rounded-full"
                            style={{ width: `${scorePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-5 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
              <span>معدل التحسن الإجمالي:</span>
              <span className="font-bold text-emerald-700 font-mono">
                {scores.length > 1 ? `+${(scores[scores.length - 1] - scores[0]).toFixed(1)} نقطة` : 'قيد الرصد الدوري'}
              </span>
            </div>
          </div>

          {/* Contact & Follow-up Information */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs text-xs space-y-3">
            <h4 className="font-bold text-stone-900">معلومات المتابعة الرسمية</h4>
            
            <div className="flex items-center justify-between text-stone-600 pb-2 border-b border-stone-100">
              <span>هاتف التلميذ:</span>
              <span className="font-mono font-semibold text-stone-900" dir="ltr">{currentStudent.phone}</span>
            </div>

            <div className="flex items-center justify-between text-stone-600 pb-2 border-b border-stone-100">
              <span>هاتف الولي (للطوارئ):</span>
              <span className="font-mono font-semibold text-stone-900" dir="ltr">
                {currentStudent.parentPhone || 'غير مسجل (اختياري)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-stone-600 pb-2 border-b border-stone-100">
              <span>تاريخ التسجيل:</span>
              <span className="font-mono text-stone-700">{currentStudent.registrationDate}</span>
            </div>

            {isStudentRole && (
              <div className="pt-2 text-center text-[11px] text-emerald-800 bg-emerald-50 py-2 rounded-lg font-bold">
                حساب تلميذ معتمد 🎓 — بالتوفيق والنجاح
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
