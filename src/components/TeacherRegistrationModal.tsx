import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  User, 
  Phone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Sparkles,
  School
} from 'lucide-react';
import { Teacher, AppUser } from '../types';
import { BadhraLogo } from './BadhraLogo';

interface TeacherRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (newTeacher: Teacher, newUser: AppUser) => void;
}

export const TeacherRegistrationModal: React.FC<TeacherRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegister,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!firstName.trim() || !lastName.trim()) errs.name = 'يرجى إدخال اسم ولقب الأستاذ معاً';
    if (!email.trim() || !email.includes('@')) errs.email = 'يرجى إدخال بريد إلكتروني صحيح';
    if (!phone.trim() || phone.trim().length < 8) errs.phone = 'يرجى إدخال رقم هاتف صحيح';
    if (!password.trim() || password.length < 4) errs.password = 'يرجى تعيين كلمة سر لا تقل عن 4 خانات';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const fullName = `أ. ${firstName.trim()} ${lastName.trim()}`;
    const newTeacherId = `tch-${Date.now().toString().slice(-4)}`;
    const finalUsername = email.trim().split('@')[0] || `prof_${phone.replace(/\D/g, '').slice(-4)}`;

    const teacherUser: AppUser = {
      id: `usr-${newTeacherId}`,
      role: 'teacher',
      username: finalUsername,
      phone: phone.trim(),
      email: email.trim(),
      password: password.trim(),
      fullName: fullName,
      relatedId: newTeacherId,
      subject: 'أستاذ متطوع',
    };

    const newTeacher: Teacher = {
      id: newTeacherId,
      fullName: fullName,
      username: finalUsername,
      email: email.trim(),
      password: password.trim(),
      phone: phone.trim(),
      subject: 'أستاذ مؤطر متطوع',
      coveredStreams: ['علوم تجريبية', 'رياضيات', 'تقني رياضي'],
      bio: 'أستاذ متطوع متميز في مبادرة جمعية بذرة غد.',
      volunteerHours: 0,
      centerName: 'دار الشباب الشهيد بوجمعة',
      activeSessionsCount: 0,
    };

    onRegister(newTeacher, teacherUser);
    setSuccessMessage(true);

    setTimeout(() => {
      setSuccessMessage(false);
      onClose();
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setErrors({});
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs p-2.5 sm:p-4 flex flex-col justify-start sm:justify-center items-center py-4 sm:py-8">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-stone-200 relative text-right modal-scrollable max-h-[92dvh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer z-10"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-stone-100 pl-8">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
            <BadhraLogo size={38} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-1.5">
                <School className="w-5 h-5 text-emerald-700" />
                <span>تسجيل أستاذ جديد</span>
              </h2>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md">تطوع وتأطير</span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 leading-snug">
              جمعية بذرة غد الشبانية · الانضمام إلى فريق الأساتذة المؤطرين بدار الشباب
            </p>
          </div>
        </div>

        {successMessage ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 animate-bounce" />
            <h3 className="text-base sm:text-lg font-black text-stone-900">تم تسجيل حساب الأستاذ بنجاح!</h3>
            <p className="text-xs text-stone-600 max-w-sm leading-relaxed">
              أهلاً بك في منصة بذرة غد! تم تفعيل فضاء الأستاذ وإشعار إدارة الجمعية.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* 1. Name & Surname (الاسم واللقب) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  الاسم <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    placeholder="مثال: عبد القادر"
                    className="w-full pr-10 pl-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-medium transition-colors"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  اللقب <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    placeholder="مثال: المنصوري"
                    className="w-full pr-10 pl-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-medium transition-colors"
                  />
                  <User className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
                </div>
              </div>
            </div>
            {errors.name && <p className="text-xs text-rose-600 font-semibold">{errors.name}</p>}

            {/* 2. Email */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                البريد الإلكتروني <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  placeholder="prof@example.com"
                  dir="ltr"
                  className="w-full pr-10 pl-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-mono transition-colors text-left"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
              </div>
              {errors.email && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.email}</p>}
            </div>

            {/* 3. Phone */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                رقم الهاتف <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="06XXXXXXXX"
                  dir="ltr"
                  className="w-full pr-10 pl-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-mono transition-colors text-left"
                />
                <Phone className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
              </div>
              {errors.phone && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.phone}</p>}
            </div>

            {/* 4. Password */}
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                كلمة السر <span className="text-rose-500">*</span>
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
                  className="w-full pr-10 pl-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden transition-colors"
                />
                <Lock className="w-4 h-4 text-stone-400 absolute right-3.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.password}</p>}
            </div>

            {/* Notice */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-600 leading-relaxed">
              🔒 <b>فضاء الأستاذ المتطوع:</b> يتيح لك برمجة الحصص، رصد الحضور، تسجيل الملاحظات، ونشر المذكرات.
            </div>

            {/* Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 sm:bg-transparent rounded-xl transition-colors cursor-pointer text-center"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 text-xs font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>تأكيد تسجيل الأستاذ</span>
              </button>
            </div>

          </form>
        )}

        </div>
      </div>
  );
};
