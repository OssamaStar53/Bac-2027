import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion, QuizSubmission, Student, AppUser, EducationLevel } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RotateCcw, 
  Award, 
  HelpCircle, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  TrendingUp,
  Lock,
  LogIn,
  UserPlus,
  BookOpen,
  GraduationCap,
  PlayCircle,
  Filter,
  CheckCircle
} from 'lucide-react';

interface QuizViewProps {
  quiz?: Quiz;
  quizzes?: Quiz[];
  students: Student[];
  currentStudentId: string;
  currentUser?: AppUser | null;
  onOpenAuth?: () => void;
  onOpenRegister?: () => void;
  onRecordResult: (submission: QuizSubmission) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  quiz: initialQuiz,
  quizzes = [],
  students,
  currentStudentId,
  currentUser,
  onOpenAuth,
  onOpenRegister,
  onRecordResult,
}) => {
  const isCurrentUserBem = currentUser?.stream?.includes('BEM') || (currentUser?.role === 'student' && students.find(s => s.id === currentUser.relatedId)?.stream?.includes('BEM'));
  
  const allQuizzes = quizzes.length > 0 ? quizzes : (initialQuiz ? [initialQuiz] : []);
  
  const [selectedLevelTab, setSelectedLevelTab] = useState<'all' | 'BEM' | 'BAC'>(isCurrentUserBem ? 'BEM' : 'all');
  const [activeQuiz, setActiveQuiz] = useState<Quiz>(allQuizzes[0] || initialQuiz!);
  const [selectedStudentId, setSelectedStudentId] = useState(currentStudentId);
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState((activeQuiz?.durationMinutes || 60) * 60);
  const [submissionResult, setSubmissionResult] = useState<QuizSubmission | null>(null);

  // Filter quizzes by tab
  const filteredQuizzes = allQuizzes.filter((q) => {
    const isBem = q.educationLevel === 'BEM' || q.stream.includes('BEM') || q.title.includes('BEM') || q.title.includes('متوسط');
    if (selectedLevelTab === 'BEM') return isBem;
    if (selectedLevelTab === 'BAC') return !isBem;
    return true;
  });

  const handleSelectQuiz = (q: Quiz) => {
    setActiveQuiz(q);
    setTimeLeft(q.durationMinutes * 60);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setIsStarted(false);
    setIsFinished(false);
    setSubmissionResult(null);
  };

  // Timer countdown
  useEffect(() => {
    let timer: any;
    if (isStarted && !isFinished && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, isFinished, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmitQuiz = () => {
    let correct = 0;
    const weakTopicsSet = new Set<string>();

    activeQuiz.questions.forEach((q: QuizQuestion) => {
      const selected = selectedAnswers[q.id];
      if (selected === q.correctOptionIndex) {
        correct++;
      } else {
        weakTopicsSet.add(q.topic);
      }
    });

    const score = Number(((correct / activeQuiz.totalQuestions) * 20).toFixed(1));
    const student = students.find((s) => s.id === selectedStudentId) || students[0];

    const submission: QuizSubmission = {
      id: `sub-${Date.now().toString().slice(-4)}`,
      studentId: student ? student.id : 'guest',
      studentName: currentUser?.fullName || (student ? student.fullName : 'تلميذ مسجل'),
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      score,
      correctCount: correct,
      totalQuestions: activeQuiz.totalQuestions,
      timestamp: new Date().toISOString(),
      answers: selectedAnswers,
      weaknesses: Array.from(weakTopicsSet),
    };

    setSubmissionResult(submission);
    setIsFinished(true);
    onRecordResult(submission);
  };

  const handleRestart = () => {
    setIsStarted(false);
    setIsFinished(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeLeft(activeQuiz.durationMinutes * 60);
    setSubmissionResult(null);
  };

  const currentQ = activeQuiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* 1. QUIZ CATALOG & SELECTION SCREEN (When not taking a test) */}
      {!isStarted && !isFinished && (
        <div className="space-y-8">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 text-amber-300 text-xs font-bold border border-emerald-500/40 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>بنك الاختبارات الإلكترونية التفاعلية</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                اختبارات تجريبية مؤتمتة <br />
                <span className="text-emerald-200">لبكالوريا 2027 وشهادة التعليم المتوسط (BEM)</span>
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 leading-relaxed">
                اختبارات ذكية معدة من طرف نخبة أساتذة جمعية «بذرة غد» لقياس الجاهزية المعرفية مع توقيت نظامي وتصحيح آلي فوري ورصد لنقاط الضعف.
              </p>
            </div>
          </div>

          {/* Level Switcher Tabs: BEM vs BAC vs All */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div className="flex items-center gap-2 p-1.5 bg-stone-100 rounded-2xl w-full sm:w-auto">
              <button
                onClick={() => setSelectedLevelTab('all')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedLevelTab === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                جميع الاختبارات ({allQuizzes.length})
              </button>

              <button
                onClick={() => setSelectedLevelTab('BEM')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedLevelTab === 'BEM'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>شهادة التعليم المتوسط (BEM)</span>
              </button>

              <button
                onClick={() => setSelectedLevelTab('BAC')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedLevelTab === 'BAC'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>شهادة البكالوريا (BAC)</span>
              </button>
            </div>

            <div className="text-xs text-stone-500 font-medium">
              متاح حالياً: <b>{filteredQuizzes.length}</b> اختبار تفاعلي
            </div>
          </div>

          {/* Quizzes Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredQuizzes.map((q) => {
              const isBem = q.educationLevel === 'BEM' || q.stream.includes('BEM') || q.title.includes('BEM') || q.title.includes('متوسط');
              const isCurrentActive = activeQuiz.id === q.id;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-3xl border p-6 flex flex-col justify-between transition-all hover:shadow-md ${
                    isCurrentActive 
                      ? isBem ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-sm' : 'border-emerald-600 ring-2 ring-emerald-500/40 shadow-sm' 
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div>
                    {/* Badges */}
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-md font-black text-[10px] ${
                          isBem 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                        }`}>
                          {isBem ? '4 متوسط (BEM 2027)' : '3 ثانوي (BAC 2027)'}
                        </span>

                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-stone-100 text-stone-700">
                          {q.subject}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-stone-500">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{q.durationMinutes} دقيقة</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 leading-snug mb-2">
                      {q.title}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-4">
                      {isBem 
                        ? 'اختبار تجريبي شامل لتقييم مكتسبات السنة الرابعة متوسط في مادة ' + q.subject + ' والتحضير للبيام.'
                        : 'اختبار دقيق لقياس الجاهزية والتحكم في مفاهيم السنة الثالثة ثانوي في مادة ' + q.subject + ' لبكالوريا 2027.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100 mb-4 font-mono">
                      <div>
                        <span className="text-[10px] text-stone-400 block font-sans">عدد الأسئلة:</span>
                        <b className="text-stone-800">{q.totalQuestions} أسئلة MCQ</b>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block font-sans">سلم التنقيط:</span>
                        <b className="text-emerald-700 font-bold">على 20 نقطة</b>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-stone-500 truncate">
                      الشعبة: <b className="text-stone-800">{q.stream}</b>
                    </span>

                    <button
                      onClick={() => handleSelectQuiz(q)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isBem
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                      }`}
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>اختيار وبدء الاختبار</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Quiz Launch Preview Modal / Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-7 shadow-lg text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7 text-emerald-700" />
            </div>

            <div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                activeQuiz.educationLevel === 'BEM' || activeQuiz.stream.includes('BEM')
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-950 border border-emerald-300'
              }`}>
                {activeQuiz.educationLevel === 'BEM' || activeQuiz.stream.includes('BEM') ? 'شهادة التعليم المتوسط (BEM)' : 'شهادة البكالوريا (BAC)'}
              </span>
              <h2 className="text-xl font-black text-stone-900 tracking-tight mt-2">
                {activeQuiz.title}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                المادة: <b>{activeQuiz.subject}</b> · الشعبة: <b>{activeQuiz.stream}</b>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs text-stone-700 max-w-xs mx-auto py-1">
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 block">الأسئلة</span>
                <span className="font-mono font-bold text-stone-900">{activeQuiz.totalQuestions}</span>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 block">الوقت</span>
                <span className="font-mono font-bold text-emerald-700">⏱️ {activeQuiz.durationMinutes} د</span>
              </div>
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <span className="text-[10px] text-stone-400 block">العلامة</span>
                <span className="font-mono font-bold text-stone-900">20 / 20</span>
              </div>
            </div>

            {!currentUser ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center space-y-2.5">
                <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold text-xs">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>تسجيل النقاط في بطاقتك الرقمية يتطلب الدخول</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  يرجى تسجيل الدخول أو إنشاء حساب تلميذ لتسجيل نتيجتك ونقاط الضعف في بطاقتك.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={onOpenAuth}
                    className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    تسجيل الدخول
                  </button>
                  <button
                    onClick={onOpenRegister}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    تسجيل تلميذ جديد
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  onClick={() => setIsStarted(true)}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-5 h-5 text-amber-300" />
                  <span>بدء الاختبار الآن (تشغيل العداد {activeQuiz.durationMinutes} دقيقة)</span>
                </button>
                <div className="text-[11px] text-stone-500 mt-2">
                  إجراء الاختبار باسم: <b className="text-stone-800">{currentUser.fullName}</b>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 2. ACTIVE QUIZ STATE */}
      {isStarted && !isFinished && (
        <div className="space-y-6">
          
          {/* Top Sticky Timer Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xs font-semibold text-stone-600">
                السؤال <span className="font-mono font-bold text-stone-900 text-sm">{currentQuestionIndex + 1}</span> من {activeQuiz.totalQuestions}
              </div>
              <span aria-hidden="true" className="text-stone-300">|</span>
              <div className="text-xs text-stone-500">
                تمت الإجابة على: <b className="font-mono text-emerald-700">{answeredCount}</b> / {activeQuiz.totalQuestions}
              </div>
            </div>

            {/* Countdown Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs ${
              timeLeft < 300 
                ? 'bg-rose-100 text-rose-800 animate-pulse border border-rose-300' 
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              <Clock className="w-4 h-4" />
              <span>⏱️ الوقت المتبقي: {formatTime(timeLeft)}</span>
            </div>

            <button
              onClick={handleSubmitQuiz}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              إنهاء وتسليم الاختبار
            </button>
          </div>

          {/* Question Grid Quick Navigator */}
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 flex flex-wrap gap-1.5 items-center justify-center">
            {activeQuiz.questions.map((q: QuizQuestion, idx: number) => {
              const isAnswered = selectedAnswers[q.id] !== undefined;
              const isCurrent = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-800 text-white ring-2 ring-emerald-500'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between text-xs text-stone-500 mb-4 pb-2 border-b border-stone-100">
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md">المحور: {currentQ.topic}</span>
              <span className="font-mono text-stone-400">سؤال رقم {currentQ.id}</span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-relaxed mb-6">
              {currentQ.questionText}
            </h2>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQ.options.map((opt: string, optIdx: number) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                    className={`w-full text-right p-4 rounded-2xl border text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        isSelected ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-300'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next / Previous Controls */}
            <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
              >
                <ChevronRight className="w-4 h-4" />
                <span>السؤال السابق</span>
              </button>

              {currentQuestionIndex < activeQuiz.totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <span>السؤال الموالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>إنهاء وتسليم الاختبار</span>
                </button>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 3. SUBMISSION RESULT STATE */}
      {isFinished && submissionResult && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-md text-right space-y-6">
          
          <div className="text-center space-y-3 pb-6 border-b border-stone-100">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
              <Award className="w-8 h-8 text-emerald-700" />
            </div>

            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                {activeQuiz.title}
              </span>
              <h2 className="text-2xl font-black text-stone-900 mt-2">
                نتيجة الاختبار: <span className="font-mono text-emerald-700">{submissionResult.score} / 20</span>
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                أجبت بشكل صحيح على <b>{submissionResult.correctCount}</b> من أصل <b>{submissionResult.totalQuestions}</b> سؤالاً.
              </p>
            </div>

            <div className="inline-block p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold">
              ✓ تم تسجيل هذه النتيجة وتحديث بطاقتك الرقمية الرسمية بنجاح!
            </div>
          </div>

          {/* Weaknesses Identified */}
          {submissionResult.weaknesses.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>محاور بحاجة إلى مراجعة ودعم بيداغوجي:</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {submissionResult.weaknesses.map((w, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Full Questions Review & Model Explanations */}
          <div className="space-y-4 pt-4">
            <h3 className="font-black text-stone-900 text-sm">
              مراجعة الأسئلة مع التصحيح والشرح النموذجي:
            </h3>

            {activeQuiz.questions.map((q: QuizQuestion, idx: number) => {
              const studentAnswer = submissionResult.answers[q.id];
              const isCorrect = studentAnswer === q.correctOptionIndex;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border text-xs space-y-2 ${
                    isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-800">سؤال {idx + 1}: {q.topic}</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isCorrect ? 'إجابة صحيحة ✓' : 'إجابة خاطئة ✗'}
                    </span>
                  </div>

                  <p className="font-semibold text-stone-900">{q.questionText}</p>

                  <div className="text-[11px] space-y-1 pt-1">
                    <div>إجابتك: <b className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                      {studentAnswer !== undefined ? q.options[studentAnswer] : 'لم تتم الإجابة'}
                    </b></div>
                    {!isCorrect && (
                      <div>الإجابة النموذجية الصحيحة: <b className="text-emerald-800">{q.options[q.correctOptionIndex]}</b></div>
                    )}
                  </div>

                  {q.explanation && (
                    <div className="mt-2 p-2.5 bg-white/80 rounded-xl border border-stone-200/80 text-stone-600 text-[11px] leading-relaxed">
                      💡 <b>الشرح والتعليل:</b> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-center gap-3">
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>العودة لقائمة الاختبارات</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
