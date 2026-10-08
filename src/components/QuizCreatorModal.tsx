import React, { useState } from 'react';
import { Quiz, QuizQuestion, BacStream, EducationLevel, BEM_STREAMS, BAC_STREAMS, BEM_SUBJECTS, BAC_SUBJECTS, AppUser } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  BookOpen, 
  Award, 
  Sparkles,
  Layers,
  Send,
  AlertCircle
} from 'lucide-react';

interface QuizCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onPublishQuiz: (newQuiz: Quiz) => void;
}

export const QuizCreatorModal: React.FC<QuizCreatorModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPublishQuiz,
}) => {
  const [level, setLevel] = useState<EducationLevel>('BAC');
  const [title, setTitle] = useState('');
  const [stream, setStream] = useState<BacStream>('علوم تجريبية');
  const [subject, setSubject] = useState('الرياضيات');
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Questions List State
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 1,
      topic: 'المفاهيم الأساسية',
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0,
      explanation: '',
    },
  ]);

  const [formError, setFormError] = useState('');
  const [publishSuccess, setPublishSuccess] = useState(false);

  if (!isOpen) return null;

  // Change Level (BEM vs BAC)
  const handleLevelChange = (newLevel: EducationLevel) => {
    setLevel(newLevel);
    if (newLevel === 'BEM') {
      setStream('السنة الرابعة متوسط (BEM)');
      setSubject(BEM_SUBJECTS[0]);
    } else {
      setStream('علوم تجريبية');
      setSubject(BAC_SUBJECTS[0]);
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        topic: 'مفاهيم المحور',
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        explanation: '',
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: any) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const newOpts = [...q.options];
        newOpts[optIndex] = text;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('يرجى كتابة عنوان الاختبار');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setFormError(`يرجى كتابة نص السؤال رقم ${i + 1}`);
        return;
      }
      const validOptions = q.options.filter((opt) => opt.trim().length > 0);
      if (validOptions.length < 2) {
        setFormError(`يجب توفير خيارين على الأقل للسؤال رقم ${i + 1}`);
        return;
      }
    }

    const newQuiz: Quiz = {
      id: `quiz-custom-${Date.now().toString().slice(-5)}`,
      title: title.trim(),
      subject,
      stream,
      educationLevel: level,
      durationMinutes: Number(durationMinutes) || 20,
      totalQuestions: questions.length,
      questions: questions.map((q, idx) => ({ ...q, id: idx + 1 })),
      teacherId: currentUser?.relatedId || 'tch-001',
      teacherName: currentUser?.fullName || 'الأستاذ المؤطر',
      createdAt: new Date().toISOString().split('T')[0],
      isCustomTeacherQuiz: true,
    };

    onPublishQuiz(newQuiz);
    setPublishSuccess(true);
    setTimeout(() => {
      setPublishSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-stone-200 relative my-8 text-right max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-stone-100 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black text-stone-900">
              تصميم ونشر اختبار تفاعلي متعدد الخيارات (MCQ)
            </h2>
            <p className="text-xs text-stone-500">
              إعداد اختبار مصحح آلياً لتلاميذ شهادة التعليم المتوسط (BEM) أو البكالوريا (BAC) مع تخزين النتائج فوراً
            </p>
          </div>
        </div>

        {publishSuccess ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-black text-stone-900">تم نشر الاختبار بنجاح في بنك الاختبارات!</h3>
            <p className="text-xs text-stone-500 mt-1">أصبح متاحاً الآن للتلاميذ لإنجازه وحفظ نقاطهم في سجلاتهم.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-6">
            
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Step 1: General Info */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-4">
              <span className="text-xs font-bold text-stone-800 block">1. البيانات العامة للاختبار:</span>

              {/* Level Selector: BEM vs BAC */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  المستوى الدراسي المستهدف:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleLevelChange('BEM')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      level === 'BEM'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span>📘 شهادة التعليم المتوسط (BEM)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLevelChange('BAC')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      level === 'BAC'
                        ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    <span>🎓 شهادة البكالوريا (BAC)</span>
                  </button>
                </div>
              </div>

              {/* Quiz Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  عنوان الاختبار <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={level === 'BEM' ? 'مثال: اختبار تقييمي في الحساب على الجذور ونظرية طالس' : 'مثال: اختبار في الدوال العددية والمتتاليات للبكالوريا'}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 font-bold focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Stream, Subject & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {level === 'BAC' ? (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      الشعبة:
                    </label>
                    <select
                      value={stream}
                      onChange={(e) => setStream(e.target.value as BacStream)}
                      className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                    >
                      {BAC_STREAMS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      الطور:
                    </label>
                    <input
                      type="text"
                      disabled
                      value="السنة الرابعة متوسط (BEM)"
                      className="w-full px-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-xs text-stone-600 font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    المادة:
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                  >
                    {(level === 'BEM' ? BEM_SUBJECTS : BAC_SUBJECTS).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    المدة المحددة (دقائق):
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Questions Builder */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-800 block">
                    2. أسئلة الاختبار والخيارات المتعددة ({questions.length} أسئلة):
                  </span>
                  <span className="text-[11px] text-stone-500">
                    ضع لكل سؤال خيارات متعددة وحدد الخيار الصحيح الذي سيعتمده نظام التصحيح التلقائي
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة سؤال</span>
                </button>
              </div>

              {questions.map((q, qIndex) => (
                <div
                  key={qIndex}
                  className="bg-white rounded-2xl border border-stone-200 p-4 md:p-5 shadow-xs space-y-3 relative hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <span className="font-black text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                      السؤال رقم {qIndex + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={q.topic}
                        onChange={(e) => handleQuestionChange(qIndex, 'topic', e.target.value)}
                        placeholder="المحور / الدرس (مثال: نظرية طالس)"
                        className="px-2.5 py-1 text-[11px] bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-hidden"
                      />

                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          title="حذف هذا السؤال"
                          className="p-1 text-stone-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      نص السؤال:
                    </label>
                    <input
                      type="text"
                      value={q.questionText}
                      onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                      placeholder="اكتب نص السؤال بدقة ووضوح..."
                      required
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pt-1">
                    <label className="block text-[11px] font-semibold text-stone-600">
                      الخيارات المقترحة (انقر على الدائرة لتحديد الإجابة الصحيحة):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                            q.correctOptionIndex === optIdx
                              ? 'bg-emerald-50/70 border-emerald-400'
                              : 'bg-stone-50 border-stone-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-opt-${qIndex}`}
                            checked={q.correctOptionIndex === optIdx}
                            onChange={() => handleQuestionChange(qIndex, 'correctOptionIndex', optIdx)}
                            className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIndex, optIdx, e.target.value)}
                            placeholder={`الخيار ${optIdx + 1}...`}
                            required
                            className="flex-1 bg-transparent border-none text-xs text-stone-900 focus:outline-hidden"
                          />
                          {q.correctOptionIndex === optIdx && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                              صحيح
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation note */}
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      شرح وتبرير الإجابة النموذجية (يظهر للتلميذ بعد انتهاء الاختبار):
                    </label>
                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                      placeholder="اكتب التوضيح أو القانون الرياضي المعتمد..."
                      className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Form Actions */}
            <div className="pt-4 border-t border-stone-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-stone-500">
                المجموع: <b className="text-stone-800">{questions.length} أسئلة</b> مصححة على 20 نقطة.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>نشر الاختبار للتلاميذ الآن</span>
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
