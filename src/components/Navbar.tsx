import React from 'react';
import { 
  Bell, 
  MessageSquareShare, 
  UserPlus, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  GraduationCap, 
  School,
  Megaphone,
  BookOpen,
  Award,
  Sparkles,
  Lock,
  MessageCircle
} from 'lucide-react';
import { AppUser, SiteSettings } from '../types';
import { BadhraLogo } from './BadhraLogo';

export type ActiveTab = 
  | 'schedule'
  | 'teacher_space'
  | 'student_card'
  | 'quizzes'
  | 'resources'
  | 'association_dashboard'
  | 'control_panel'
  | 'communication';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenRegisterStudent: () => void;
  onOpenRegisterTeacher: () => void;
  onOpenAuth: () => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  unreadCount: number;
  onToggleNotifications: () => void;
  siteSettings: SiteSettings;
  onOpenProfileModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRegisterStudent,
  onOpenRegisterTeacher,
  onOpenAuth,
  currentUser,
  onLogout,
  unreadCount,
  onToggleNotifications,
  siteSettings,
  onOpenProfileModal,
}) => {
  const renderLogoIcon = () => {
    if (siteSettings.customLogoUrl && siteSettings.customLogoUrl !== '/badhra-logo.svg') {
      return (
        <img
          src={siteSettings.customLogoUrl}
          alt={siteSettings.siteName}
          className="w-10 h-10 object-contain rounded-full select-none"
          onError={(e) => {
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
      );
    }
    return <BadhraLogo size={40} className="w-10 h-10 shrink-0" />;
  };

  const getBannerColorClass = () => {
    switch (siteSettings.bannerColor) {
      case 'amber':
        return 'bg-amber-600 text-amber-50 border-amber-700';
      case 'rose':
        return 'bg-rose-700 text-rose-50 border-rose-800';
      case 'sky':
        return 'bg-sky-700 text-sky-50 border-sky-800';
      case 'emerald':
      default:
        return 'bg-emerald-900 text-emerald-100 border-emerald-800';
    }
  };

  return (
    <div className="sticky top-0 z-40">
      
      {/* Urgent Announcement Marquee Banner (Controlled by Admin) */}
      {siteSettings.urgentAnnouncementEnabled && (
        <div className={`${getBannerColorClass()} text-xs py-1.5 px-4 text-center font-medium border-b flex items-center justify-center gap-2`}>
          <Megaphone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span className="truncate max-w-4xl">{siteSettings.urgentAnnouncementText}</span>
        </div>
      )}

      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Zone 1: Dynamic Brand Title & Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setActiveTab('schedule')}
                className="flex items-center gap-2 sm:gap-2.5 text-right group cursor-pointer focus-visible:outline-hidden min-w-0"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border border-stone-200 p-0.5 flex items-center justify-center shadow-xs group-hover:border-emerald-600 transition-colors shrink-0">
                  {renderLogoIcon()}
                </div>
                <div className="flex flex-col text-right min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm sm:text-base md:text-lg font-black tracking-tight text-emerald-950 truncate max-w-[125px] xs:max-w-[180px] sm:max-w-none">
                      {siteSettings.siteName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 hidden md:inline-block">
                      {siteSettings.siteSubtitle}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 leading-tight truncate">
                    جمعية بذرة غد · إن صالح
                  </span>
                </div>
              </button>
            </div>

            {/* Zone 2: Clean Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('schedule')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'schedule'
                    ? 'text-emerald-800 font-bold bg-emerald-50'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                برنامج الدعم
              </button>

              {/* Only show Admin Control Panel if logged in as association_admin */}
              {currentUser?.role === 'association_admin' && (
                <button
                  onClick={() => setActiveTab('control_panel')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'control_panel'
                      ? 'text-white font-bold bg-stone-900 shadow-xs'
                      : 'text-stone-800 bg-amber-100/70 hover:bg-amber-200 border border-amber-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>لوحة تحكم الجمعية (أدمن)</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('teacher_space')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'teacher_space'
                    ? 'text-emerald-800 font-bold bg-emerald-50'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                فضاء الأستاذ المتطوع
              </button>

              <button
                onClick={() => setActiveTab('student_card')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'student_card'
                    ? 'text-emerald-800 font-bold bg-emerald-50'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                {!currentUser && <Lock className="w-3 h-3 text-amber-600" />}
                <span>
                  {currentUser?.role === 'student'
                    ? 'بطاقتي الرقمية'
                    : (currentUser?.role === 'teacher' || currentUser?.role === 'association_admin')
                    ? 'بطاقات التلاميذ'
                    : 'البطاقة الرقمية 🔒'}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('quizzes')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'quizzes'
                    ? 'text-emerald-800 font-bold bg-emerald-50'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                الاختبارات الإلكترونية
              </button>

              <button
                onClick={() => setActiveTab('resources')}
                className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'resources'
                    ? 'text-emerald-800 font-bold bg-emerald-50'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                المكتبة والباك والبيام (BAC & BEM)
              </button>

              {/* Only show Statistics to Teachers and Admin */}
              {(currentUser?.role === 'teacher' || currentUser?.role === 'association_admin') && (
                <button
                  onClick={() => setActiveTab('association_dashboard')}
                  className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    activeTab === 'association_dashboard'
                      ? 'text-emerald-800 font-bold bg-emerald-50'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  الإحصائيات
                </button>
              )}
            </nav>

            {/* Zone 3: Primary Actions and User Role State */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              
              {siteSettings.whatsappChannelUrl && (
                <a
                  href={siteSettings.whatsappChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="قناة الواتساب الرسمية للجمعية"
                  className="p-1.5 sm:p-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 transition-colors flex items-center justify-center shrink-0"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </a>
              )}

              <button
                onClick={() => setActiveTab('communication')}
                title="إرسال تذكير عبر واتساب / تيليغرام"
                className={`p-1.5 sm:p-2 rounded-lg border transition-colors cursor-pointer hidden md:flex items-center justify-center shrink-0 ${
                  activeTab === 'communication'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <MessageSquareShare className="w-4 h-4" />
              </button>

              <button
                onClick={onToggleNotifications}
                title="الإشعارات"
                className="relative p-1.5 sm:p-2 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer shrink-0"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center font-mono">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Logged in User Badge vs Login Button */}
              {currentUser ? (
                <div className="flex items-center gap-1 sm:gap-1.5 bg-stone-100 border border-stone-200 py-1 px-1.5 sm:px-2 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={onOpenProfileModal}
                    title="تعديل الملف الشخصي وصورة البروفيل"
                    className="flex items-center gap-1 sm:gap-1.5 text-xs text-right hover:opacity-80 transition-opacity cursor-pointer group"
                  >
                    {currentUser.avatarUrl ? (
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.fullName}
                        className="w-6 h-6 rounded-lg object-cover border border-emerald-500 shadow-2xs shrink-0"
                      />
                    ) : currentUser.role === 'association_admin' ? (
                      <span className="w-6 h-6 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                    ) : currentUser.role === 'teacher' ? (
                      <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
                        <School className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="font-bold text-stone-800 max-w-[70px] sm:max-w-[100px] truncate group-hover:text-emerald-800">
                      {currentUser.fullName}
                    </span>
                  </button>

                  <button
                    onClick={onLogout}
                    title="تسجيل الخروج"
                    className="p-1 text-stone-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  {/* 1. تسجيل الدخول - Always prominent */}
                  <button
                    onClick={onOpenAuth}
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
                    title="تسجيل الدخول إلى حسابك أو إنشاء حساب جديد"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-800" />
                    <span>تسجيل الدخول</span>
                  </button>

                  {/* 2. تسجيل التلاميذ - Displayed on tablets & desktop to preserve mobile screen space */}
                  <button
                    onClick={onOpenRegisterStudent}
                    className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
                    title="تسجيل تلميذ جديد"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                    <span>تسجيل التلاميذ</span>
                  </button>

                  {/* 3. تسجيل الأساتذة - Displayed on desktop to preserve mobile screen space */}
                  <button
                    onClick={onOpenRegisterTeacher}
                    className="hidden md:flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
                    title="انضمام كأستاذ مؤطر متطوع"
                  >
                    <School className="w-3.5 h-3.5 text-blue-700" />
                    <span>تسجيل الأساتذة</span>
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Mobile Navigation bar */}
          <div className="xl:hidden flex items-center gap-1.5 overflow-x-auto py-2 border-t border-stone-100 no-scrollbar text-xs scroll-smooth">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer shrink-0 ${
                activeTab === 'schedule' ? 'bg-emerald-700 text-white font-medium' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              برنامج الدعم
            </button>

            {/* Quick Registration buttons on mobile when not logged in */}
            {!currentUser && (
              <>
                <button
                  onClick={onOpenRegisterStudent}
                  className="px-2.5 py-1 rounded-md whitespace-nowrap text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-bold border border-emerald-200 shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <GraduationCap className="w-3 h-3 text-emerald-700" />
                  <span>تسجيل تلميذ</span>
                </button>
                <button
                  onClick={onOpenRegisterTeacher}
                  className="px-2.5 py-1 rounded-md whitespace-nowrap text-blue-800 bg-blue-50 hover:bg-blue-100 font-bold border border-blue-200 shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <School className="w-3 h-3 text-blue-700" />
                  <span>تسجيل أستاذ</span>
                </button>
              </>
            )}

            {currentUser?.role === 'association_admin' && (
              <button
                onClick={() => setActiveTab('control_panel')}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  activeTab === 'control_panel' ? 'bg-stone-900 text-white font-bold' : 'text-amber-900 bg-amber-100 font-bold'
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-amber-500" />
                <span>لوحة الأدمن</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('teacher_space')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer ${
                activeTab === 'teacher_space' ? 'bg-emerald-700 text-white font-medium' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              فضاء الأستاذ
            </button>
            
            <button
              onClick={() => setActiveTab('student_card')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                activeTab === 'student_card' ? 'bg-emerald-700 text-white font-medium' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              {!currentUser && <Lock className="w-3 h-3 text-amber-500" />}
              <span>
                {currentUser?.role === 'student'
                  ? 'بطاقتي الرقمية'
                  : (currentUser?.role === 'teacher' || currentUser?.role === 'association_admin')
                  ? 'بطاقات التلاميذ'
                  : 'البطاقة الرقمية 🔒'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quizzes')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer ${
                activeTab === 'quizzes' ? 'bg-emerald-700 text-white font-medium' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              الاختبارات (20 سؤال)
            </button>

            <button
              onClick={() => setActiveTab('resources')}
              className={`px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer ${
                activeTab === 'resources' ? 'bg-emerald-700 text-white font-medium' : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              المكتبة والباك
            </button>

            {(currentUser?.role === 'teacher' || currentUser?.role === 'association_admin') && (
              <button
                onClick={() => setActiveTab('association_dashboard')}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap cursor-pointer ${
                  activeTab === 'association_dashboard' ? 'bg-emerald-700 text-white font-medium' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                الإحصائيات
              </button>
            )}
          </div>

        </div>
      </header>
    </div>
  );
};
