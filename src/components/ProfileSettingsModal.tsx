import React, { useState } from 'react';
import { AppUser, Student, Teacher } from '../types';
import { 
  X, 
  Camera, 
  Upload, 
  User, 
  Phone, 
  MapPin, 
  School, 
  BookOpen, 
  ShieldCheck, 
  CheckCircle2, 
  Trash2, 
  Sparkles,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onUpdateProfile: (updatedData: {
    avatarUrl?: string;
    fullName?: string;
    phone?: string;
    wilaya?: string;
    password?: string;
  }) => void;
}

// Curated aesthetic preset avatars
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
}) => {
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [wilaya, setWilaya] = useState(currentUser?.wilaya || 'الجزائر العاصمة');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [fileError, setFileError] = useState('');

  if (!isOpen || !currentUser) return null;

  // Handle local image file upload (converts to base64 DataURL)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميغابايت');
      return;
    }

    setFileError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setAvatarUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      avatarUrl: avatarUrl || undefined,
      fullName: fullName.trim() || currentUser.fullName,
      phone: phone.trim() || currentUser.phone,
      wilaya: wilaya.trim() || currentUser.wilaya,
      password: newPassword.trim() ? newPassword.trim() : undefined,
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  const roleLabel = 
    currentUser.role === 'association_admin'
      ? 'إدارة جمعية بذرة غد'
      : currentUser.role === 'teacher'
      ? 'أستاذ مؤطر متطوع'
      : 'تلميذ مقبل على البكالوريا 2027';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs p-2.5 sm:p-4">
      <div className="min-h-full flex items-center justify-center py-3 sm:py-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4.5 sm:p-6 shadow-2xl border border-stone-200 relative text-right">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 sm:top-5 sm:left-5 p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors z-10"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
            <Camera className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">الملف الشخصي وصورة الحساب</h2>
            <p className="text-xs text-stone-500">تحديث صورة البروفيل والبيانات الشخصية لحسابك في المنصة</p>
          </div>
        </div>

        {savedSuccess ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto mb-3 animate-bounce" />
            <h3 className="text-base font-bold text-stone-900">تم حفظ صورة البروفيل وتحديث البيانات بنجاح!</h3>
            <p className="text-xs text-stone-500 mt-1">تنعكس التغييرات فوراً في البطاقة وفضاء المنصة.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            
            {/* Avatar Section */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <label className="block text-xs font-bold text-stone-800 mb-3">
                صورة البروفيل الحالية:
              </label>

              <div className="flex items-center gap-4">
                <div className="relative group">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={currentUser.fullName}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-emerald-800 text-white flex items-center justify-center text-2xl font-black shadow-sm">
                      {currentUser.fullName.slice(0, 2)}
                    </div>
                  )}

                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      title="حذف الصورة"
                      className="absolute -top-2 -left-2 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-full shadow-md transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div>
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>اختر صورة من هاتفك أو حاسوبك</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <span className="block text-[11px] text-stone-500">
                    تدعم صيغ JPG, PNG, WEBP (حجم أقل من 5 ميغابايت)
                  </span>
                </div>
              </div>

              {fileError && (
                <p className="text-xs text-rose-600 font-semibold mt-2">{fileError}</p>
              )}

              {/* Preset Avatars Selection */}
              <div className="mt-4 pt-3 border-t border-stone-200">
                <span className="block text-[11px] font-semibold text-stone-600 mb-2">
                  أو اختر صورة جاهزة من القائمة:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(url)}
                      className={`relative shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        avatarUrl === url
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105'
                          : 'border-transparent hover:border-stone-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt={`avatar-${idx}`} className="w-10 h-10 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Role Badge Info */}
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-500 block">الصفة في المنصة:</span>
                <span className="font-bold text-emerald-900">{roleLabel}</span>
              </div>
              <span className="font-mono text-xs bg-white px-2.5 py-1 rounded-md text-emerald-800 border border-emerald-200 font-semibold">
                @{currentUser.username}
              </span>
            </div>

            {/* Editable Info Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  الاسم الكامل:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    رقم الهاتف:
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 text-right focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    الولاية:
                  </label>
                  <input
                    type="text"
                    value={wilaya}
                    onChange={(e) => setWilaya(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  تغيير كلمة المرور (اختياري - اتركه فارغاً للإبقاء على الحالية):
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="كلمة المرور الجديدة..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-stone-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 sm:bg-transparent rounded-xl text-center"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
              >
                حفظ التغييرات وصورة البروفيل
              </button>
            </div>

          </form>
        )}

        </div>
      </div>
    </div>
  );
};
