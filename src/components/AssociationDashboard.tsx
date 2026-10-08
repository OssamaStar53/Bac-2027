import React, { useState } from 'react';
import { Student, Teacher, SupportSession, QuizSubmission, BacStream, AppUser } from '../types';
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  Percent, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  Download, 
  Filter,
  CheckCircle, 
  Clock,
  Lock,
  ShieldAlert,
  LogIn
} from 'lucide-react';

interface AssociationDashboardProps {
  students: Student[];
  teachers: Teacher[];
  sessions: SupportSession[];
  quizSubmissions: QuizSubmission[];
  currentUser?: AppUser | null;
  onOpenAuth?: () => void;
}

export const AssociationDashboard: React.FC<AssociationDashboardProps> = ({
  students,
  teachers,
  sessions,
  quizSubmissions,
  currentUser,
  onOpenAuth,
}) => {
  const [streamFilter, setStreamFilter] = useState<string>('all');
  const [exported, setExported] = useState(false);

  const filteredStudents = streamFilter === 'all' 
    ? students 
    : students.filter(s => s.stream === streamFilter);

  // Key KPI metrics
  const totalStudents = students.length;
  const bacStudentsCount = students.filter(s => !s.stream.includes('BEM') && s.educationLevel !== 'BEM').length;
  const bemStudentsCount = students.filter(s => s.stream.includes('BEM') || s.educationLevel === 'BEM').length;
  const totalTeachers = teachers.length;
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter(s => s.completed).length;

  // Average attendance rate
  const avgAttendance = (
    students.reduce((acc, s) => acc + s.attendanceRate, 0) / (students.length || 1)
  ).toFixed(1);

  // Average test score across all students
  const avgTestScore = (
    students.reduce((acc, s) => acc + s.averageScore, 0) / (students.length || 1)
  ).toFixed(1);

  // Calculate subjects that need the most support
  const subjectNeedCount: Record<string, number> = {};
  students.forEach((s) => {
    s.weaknesses.forEach((sub) => {
      subjectNeedCount[sub] = (subjectNeedCount[sub] || 0) + 1;
    });
  });

  const sortedSubjectsByNeed = Object.entries(subjectNeedCount)
    .sort((a, b) => b[1] - a[1]);

  // Aggregate stream distribution
  const streamCounts: Record<string, number> = {};
  students.forEach((s) => {
    streamCounts[s.stream] = (streamCounts[s.stream] || 0) + 1;
  });

  const handleExportReport = () => {
    const reportData = {
      initiative: 'بذرة غد – بكالوريا 2027 & شهادة التعليم المتوسط BEM',
      date: new Date().toLocaleDateString('ar-DZ'),
      totalStudents,
      bacStudentsCount,
      bemStudentsCount,
      totalTeachers,
      totalSessions,
      completedSessions,
      avgAttendance: `${avgAttendance}%`,
      avgTestScore: `${avgTestScore} / 20`,
      topSubjectsNeedingSupport: sortedSubjectsByNeed.slice(0, 5),
      streamDistribution: streamCounts,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_بذرة_غد_بكالوريا_وبي_ام_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const isAuthorized = currentUser?.role === 'teacher' || currentUser?.role === 'association_admin';

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>

          <div>
            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-md font-mono">
              بيانات محصورة 🔒
            </span>
            <h2 className="text-lg font-black text-stone-900 mt-2">
              الإحصائيات مخصصة للأساتذة وإدارة الجمعية فقط
            </h2>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              وفقاً لسياسة الخصوصية، فإن مؤشرات الحضور، ونسب التفوق في الاختبارات، ومؤشرات التلاميذ متاحة حصرياً للمدير والأساتذة المؤطرين المعتمدين.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>دخول بحساب أستاذ أو إدارة الجمعية</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              لوحة قيادة الجمعية ومتابعة الأداء
            </h1>
            <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">
              إحصائيات حية
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            رؤية شاملة للمسجلين، الأساتذة المتطوعين، الحصص المنجزة، ونسب الحضور والمواد التي تحتاج دعماً أكبر
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Stream Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-stone-200 px-3 py-1.5 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="bg-transparent text-stone-800 font-semibold focus:outline-hidden"
            >
              <option value="all">جميع المستويات والشعب ({students.length})</option>
              <option value="السنة الرابعة متوسط (BEM)">السنة الرابعة متوسط (BEM)</option>
              <option value="علوم تجريبية">علوم تجريبية (BAC)</option>
              <option value="رياضيات">رياضيات (BAC)</option>
              <option value="تقني رياضي">تقني رياضي (BAC)</option>
              <option value="تسيير واقتصاد">تسيير واقتصاد (BAC)</option>
              <option value="آداب وفلسفة">آداب وفلسفة (BAC)</option>
              <option value="لغات أجنبية">لغات أجنبية (BAC)</option>
            </select>
          </div>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exported ? 'تم تصدير التقرير' : 'تصدير التقرير الدوري'}</span>
          </button>
        </div>
      </div>

      {/* 5 Core Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-8">
        
        {/* Metric 1: Students */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">التلاميذ المسجلون</span>
            <Users className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-mono text-2xl font-black text-stone-900 tabular-nums">
            {totalStudents}
          </div>
          <div className="text-[10px] text-stone-500 mt-1 flex items-center justify-between font-medium">
            <span className="text-emerald-800">بكالوريا: {bacStudentsCount}</span>
            <span className="text-amber-800">بيام (BEM): {bemStudentsCount}</span>
          </div>
        </div>

        {/* Metric 2: Volunteer Teachers */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">الأساتذة المتطوعون</span>
            <GraduationCap className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-mono text-2xl font-black text-stone-900 tabular-nums">
            {totalTeachers}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">أستاذ مؤطر ومرافق</div>
        </div>

        {/* Metric 3: Support Sessions */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">حصص الدعم</span>
            <CalendarCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-mono text-2xl font-black text-stone-900 tabular-nums">
            {totalSessions}
          </div>
          <div className="text-[10px] text-stone-500 mt-1">{completedSessions} حصة منجزة</div>
        </div>

        {/* Metric 4: Overall Attendance */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">نسبة الحضور</span>
            <Percent className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-mono text-2xl font-black text-emerald-700 tabular-nums">
            {avgAttendance}%
          </div>
          <div className="text-[10px] text-stone-500 mt-1">انضباط عام ممتاز</div>
        </div>

        {/* Metric 5: Average Test Results */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">معدل الاختبارات</span>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="font-mono text-2xl font-black text-stone-900 tabular-nums">
            {avgTestScore} <span className="text-xs font-normal text-stone-400">/ 20</span>
          </div>
          <div className="text-[10px] text-stone-500 mt-1">تطور شهري مستمر</div>
        </div>

      </div>

      {/* Two Column Section: Subjects Needing Support & Stream Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Left: المواد التي تحتاج إلى دعم أكبر (As explicitly requested in prompt) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-stone-900 text-sm">
                المواد التي تحتاج إلى دعم أكبر (بناءً على نتائج الاختبارات)
              </h3>
            </div>
            <span className="text-[11px] text-stone-400 font-mono">ترتيب تنازلي</span>
          </div>

          <div className="space-y-4">
            {sortedSubjectsByNeed.map(([subject, count], index) => {
              const percentage = Math.round((count / totalStudents) * 100);
              return (
                <div key={subject} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-stone-100 font-mono font-bold flex items-center justify-center text-stone-600 text-[10px]">
                        0{index + 1}
                      </span>
                      <span className="font-bold text-stone-800">{subject}</span>
                    </div>
                    <div className="flex items-center gap-3 text-stone-500 font-mono">
                      <span><b>{count}</b> تلاميذ</span>
                      <span className="text-rose-700 font-bold">({percentage}%)</span>
                    </div>
                  </div>

                  <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        index === 0
                          ? 'bg-rose-500'
                          : index === 1
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600">
            💡 <b>توصية الجمعية:</b> تكثيف حصص نهاية الأسبوع في مادتي <span className="font-bold text-stone-900">الرياضيات والفيزياء</span> بدار الشباب وتخصيص ورشات حل المواضيع النموذجية.
          </div>
        </div>

        {/* Right: Distribution by Stream */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <h3 className="font-bold text-stone-900 text-sm">توزيع التلاميذ حسب الشعب</h3>
            <span className="text-[11px] text-stone-500 font-mono">{totalStudents} تلميذ</span>
          </div>

          <div className="space-y-3 text-xs">
            {Object.entries(streamCounts).map(([stream, count]) => {
              const ratio = Math.round((count / totalStudents) * 100);
              return (
                <div key={stream} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-800 block">{stream}</span>
                    <span className="text-[10px] text-stone-500">{count} مسجل</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-sm font-black text-stone-900">{ratio}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Volunteer hours total */}
          <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-500">إجمالي الساعات التطوعية المقدمة:</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {teachers.reduce((acc, t) => acc + t.volunteerHours, 0)} ساعة تطوع
            </span>
          </div>
        </div>

      </div>

      {/* Roster of Students with Progress Comparison */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-stone-900 text-sm">سجل تطور نتائج التلاميذ</h3>
            <p className="text-xs text-stone-500">المعدلات الحالية، نسبة الحضور، والمواد التي تحتاج تحسيناً</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-100 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">التلميذ</th>
                <th className="py-3 px-4">الشعبة</th>
                <th className="py-3 px-4">نسبة الحضور</th>
                <th className="py-3 px-4">معدل الاختبارات</th>
                <th className="py-3 px-4">نقاط تحتاج لتحسين</th>
                <th className="py-3 px-4">التطور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredStudents.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-stone-900">
                    {s.fullName}
                    <span className="block text-[10px] text-stone-400 font-mono">{s.highSchool}</span>
                  </td>
                  <td className="py-3 px-4 text-stone-700">{s.stream}</td>
                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                    {s.attendanceRate}%
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-stone-900">
                    {s.averageScore} / 20
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-rose-700 font-semibold">
                      {s.weaknesses.join(' – ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                    +{(s.monthlyProgression[s.monthlyProgression.length - 1]?.score - s.monthlyProgression[0]?.score).toFixed(1)} ن
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
