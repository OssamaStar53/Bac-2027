import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  School, 
  BookOpen, 
  AlertCircle, 
  GraduationCap, 
  Mail, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';
import { BacStream, Student, EducationLevel, BAC_STREAMS, BEM_SUBJECTS, BAC_SUBJECTS, AppUser } from '../types';
import { BadhraLogo } from './BadhraLogo';

interface StudentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (newStudent: Student, newUser?: AppUser) => void;
}

export const StudentRegistrationModal: React.FC<StudentRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const [fullName, setFullName] = useState('');
  const [level, setLevel] = useState<EducationLevel>('BAC');
  const [stream, setStream] = useState<BacStream>('علوم تجريبية');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [wilaya, setWilaya] = useState('إن صالح');
  const [highSchool, setHighSchool] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['الرياضيات', 'العلوم الفيزيائية']);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleLevelChange = (newLevel: EducationLevel) => {
    setLevel(newLevel);
    if (newLevel === 'BEM') {
      setStream('السنة الرابعة متوسط (BEM)');
      setSelectedSubjects(['الرياضيات', 'العلوم الفيزيائية والتكنولوجيا']);
    } else {
      setStream('علوم تجريبية');
      setSelectedSubjects(['الرياضيات', 'العلوم الفيزيائية']);
    }
  };

  const currentAvailableSubjects = level === 'BEM' ? BEM_SUBJECTS : BAC_SUBJECTS;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      if (selectedSubjects.length > 1) {
        setSelectedSubjects(selectedSubjects.filter(s => s !== sub));
      }
    } else {
      setSelectedSubjects([...selectedSubjects, sub]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!fullName.trim()) errs.fullName = 'يرجى إدخال الاسم واللقب كاملاً';
    if (!phone.trim()) errs.phone = 'يرجى إدخال رقم هاتف التلميذ';
    if (!password.trim() || password.length < 4) errs.password = 'يرجى تعيين كلمة سر لا تقل عن 4 أحرف أو أرقام';
    if (password !== confirmPassword) errs.confirmPassword = 'كلمة السر وتأكيدها غير متطابقين';
    if (!highSchool.trim()) errs.highSchool = level === 'BEM' ? 'يرجى كتابة اسم المتوسطة' : 'يرجى كتابة اسم الثانوية';
    if (selectedSubjects.length === 0) errs.subjects = 'يرجى اختيار مادة واحدة على الأقل للمتابعة';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const newStudentId = `std-${Date.now().toString().slice(-4)}`;
    const finalUsername = username.trim() || `std_${phone.replace(/\D/g, '').slice(-4) || Date.now().toString().slice(-4)}`;

    const studentUser: AppUser = {
      id: `usr-${newStudentId}`,
      role: 'student',
      username: finalUsername,
      phone: phone.trim(),
      password: password.trim(),
      fullName: fullName.trim(),
      relatedId: newStudentId,
      stream,
      wilaya: wilaya.trim(),
      recoveryEmail: email.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
    };

    const newStudent: Student = {
      id: newStudentId,
      fullName: fullName.trim(),
      username: finalUsername,
      password: password.trim(),
      stream,
      educationLevel: level,
      phone: phone.trim(),
      parentPhone: parentPhone.trim() || phone.trim(),
      wilaya: wilaya.trim(),
      highSchool: highSchool.trim(),
      enrolledSubjects: selectedSubjects,
      attendanceRate: 100, // Starts at 100%
      averageScore: 12.0, // Initial baseline score
      weaknesses: selectedSubjects.slice(0, 2),
      strengths: [],
      monthlyProgression: [
        { month: 'أكتوبر 2026', attendance: 100, score: 12.0 },
      ],
      registrationDate: new Date().toISOString().split('T')[0],
      notes: level === 'BEM' 
        ? 'تلميذ مسجل في شهادة التعليم المتوسط (4 متوسط BEM) بدار الشباب.' 
        : 'تلميذ مسجل في شهادة البكالوريا 2027 بدار الشباب.',
      avatarSeed: finalUsername,
      avatarUrl: avatarUrl || undefined,
    };

    onRegister(newStudent, studentUser);
    setSuccessMessage(true);

    setTimeout(() => {
      setSuccessMessage(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-stone-200 relative my-8 text-right">
        
        <button
          onClick={onClose}
          className="absolute top-5 left-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Badhra Logo */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
            <BadhraLogo size={42} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-stone-900 tracking-tight">تسجيل تلميذ جديد وإنشاء حساب</h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">مجاني</span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              جمعية بذرة غد الشبانية · مرافقة تلاميذ البكالوريا والتعليم المتوسط BEM
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 animate-bounce" />
            <h3 className="text-lg font-black text-stone-900">تم تسجيل حسابك بنجاح!</h3>
            <p className="text-xs text-stone-600 max-w-sm leading-relaxed">
              تم إنشاء بطاقتك الرقمية الرسمية وتفعيل حسابك للدخول لحصص الدعم والاختبارات بدار الشباب الشهيد بوجمعة.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4.5">
            
            {/* 1. Profile Avatar Upload */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center gap-3.5">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-emerald-600 shadow-xs"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-black text-base shadow-xs">
                    {fullName ? fullName.slice(0, 2) : <User className="w-6 h-6" />}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 cursor-pointer transition-colors shadow-xs">
                  <span>إضافة صورة بروفيل للتلميذ</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </label>
                <span className="block text-[11px] text-stone-500 mt-0.5">
                  تظهر في بطاقتك الرقمية الرسمية وقوائم الحضور (اختياري)
                </span>
              </div>
            </div>

            {/* 2. Full Name Input (الاسم واللقب) */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                الاسم واللقب كاملاً <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors({ ...errors, fullName: '' });
                  }}
                  placeholder="مثال: يوسف العربي"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-medium transition-colors"
                />
              </div>
              {errors.fullName && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.fullName}</p>}
            </div>

            {/* 3. Education Level Selector (PLACED DIRECTLY UNDER FULL NAME AS EXPLICITLY REQUESTED) */}
            <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-2">
              <label className="block text-xs font-black text-emerald-950">
                الطور التعليمي والشهادة المستهدفة: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleLevelChange('BAC')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                    level === 'BAC'
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <GraduationCap className={`w-5 h-5 shrink-0 ${level === 'BAC' ? 'text-amber-300' : 'text-emerald-700'}`} />
                  <div>
                    <div className="font-black text-xs">شهادة البكالوريا (BAC)</div>
                    <div className={`text-[10px] ${level === 'BAC' ? 'text-emerald-100 font-medium' : 'text-stone-500'}`}>
                      السنة الثالثة ثانوي
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleLevelChange('BEM')}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                    level === 'BEM'
                      ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <BookOpen className={`w-5 h-5 shrink-0 ${level === 'BEM' ? 'text-white' : 'text-amber-600'}`} />
                  <div>
                    <div className="font-black text-xs">شهادة التعليم المتوسط (BEM)</div>
                    <div className={`text-[10px] ${level === 'BEM' ? 'text-amber-100 font-medium' : 'text-stone-500'}`}>
                      السنة الرابعة متوسط
                    </div>
                  </div>
                </button>
              </div>

              {/* Stream Selector under Level */}
              <div className="pt-1.5">
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  {level === 'BAC' ? 'الشعبة الرسمية للبكالوريا:' : 'المستوى الدراسي المقيد:'}
                </label>
                {level === 'BAC' ? (
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value as BacStream)}
                    className="w-full px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 font-semibold focus:outline-hidden focus:border-emerald-600"
                  >
                    {BAC_STREAMS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-center justify-between">
                    <span>السنة الرابعة متوسط – شهادة التعليم المتوسط (BEM 2027)</span>
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">مواد التعليم العام</span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Credentials: Username & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  البريد الإلكتروني (لاسترجاع الحساب):
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  اسم المستخدم (لتسجيل الدخول):
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: younes_dz"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  dir="ltr"
                />
              </div>
            </div>

            {/* 5. Phone numbers: Student Phone (Mandatory) & Parent Phone (Explicitly Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  رقم هاتف التلميذ (للواتساب/تيليغرام) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="06XXXXXXXX"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:border-emerald-600 focus:outline-hidden text-left"
                  dir="ltr"
                />
                {errors.phone && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.phone}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    رقم هاتف الولي:
                  </label>
                  <span className="text-[10px] text-stone-400 font-bold bg-stone-100 px-1.5 py-0.5 rounded">غير إجباري (اختياري)</span>
                </div>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="05XXXXXXXX (اختياري)"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 font-mono focus:bg-white focus:border-emerald-600 focus:outline-hidden text-left"
                  dir="ltr"
                />
              </div>
            </div>

            {/* 6. Password and Password Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  كلمة السر لحسابك <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    placeholder="••••••••"
                    required
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  تأكيد كلمة السر <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
                {errors.confirmPassword && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* 7. Institution & Wilaya */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  {level === 'BEM' ? 'اسم المتوسطة المقيد بها' : 'اسم الثانوية المقيد بها'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={highSchool}
                  onChange={(e) => {
                    setHighSchool(e.target.value);
                    if (errors.highSchool) setErrors({ ...errors, highSchool: '' });
                  }}
                  placeholder={level === 'BEM' ? 'مثال: متوسطة الشهيد العربي بن مهيدي' : 'مثال: ثانوية العقيد لطفي'}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
                {errors.highSchool && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.highSchool}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  الولاية والبلدية / مركز الدعم <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  placeholder="مثال: إن صالح"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 8. Select Subjects */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1.5">
                المواد المراد مرافقتها ({level === 'BEM' ? 'السنة الرابعة متوسط' : 'شهادة البكالوريا'}):
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200">
                {currentAvailableSubjects.map((sub) => {
                  const isChecked = selectedSubjects.includes(sub);
                  return (
                    <button
                      type="button"
                      key={sub}
                      onClick={() => toggleSubject(sub)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}{sub}
                    </button>
                  );
                })}
              </div>
              {errors.subjects && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.subjects}</p>}
            </div>

            {/* Privacy note */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 leading-relaxed">
              🔒 <b>خصوصية تامة:</b> بياناتك وبطاقتك الرقمية محفوظة ولا تظهر لأي زائر غريب، بل يمكنك أنت وحدك أو الأساتذة المؤطرون وإدارة الجمعية مراجعتها.
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>تأكيد التسجيل وإنشاء حسابي فوراً</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
