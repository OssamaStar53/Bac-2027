import React, { useState } from 'react';
import { AppNotification } from '../types';
import { 
  X, 
  Bell, 
  Check, 
  Share2, 
  Calendar, 
  BookOpen, 
  AlertCircle, 
  ShieldCheck, 
  UserPlus, 
  GraduationCap, 
  School,
  Phone,
  Copy,
  CheckCheck
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkRead,
}) => {
  const [filter, setFilter] = useState<'all' | 'admin_registrations' | 'sessions'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleShare = (msg: string) => {
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isRegistrationNotif = (notif: AppNotification) => {
    return notif.targetRole === 'admins' || 
           notif.title.includes('تسجيل') || 
           notif.message.includes('تسجيل');
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'admin_registrations') {
      return isRegistrationNotif(notif);
    }
    if (filter === 'sessions') {
      return notif.type === 'session' || notif.title.includes('حصة') || notif.title.includes('اختبار');
    }
    return true;
  });

  const adminRegistrationsCount = notifications.filter((n) => isRegistrationNotif(n) && !n.read).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-right">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-stone-900">مركز الإشعارات والتنبيهات</h2>
                <span className="text-[11px] text-stone-500">متابعة حصص الدعم وإشعارات الإدارة</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onMarkAllRead}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
              >
                تحديد الكل كمقروء
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Enable Mobile Notification Bar */}
          <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
            <div className="flex items-center gap-1.5 min-w-0">
              <Bell className="w-3.5 h-3.5 text-emerald-700 shrink-0 animate-pulse" />
              <span className="truncate text-[11px] font-medium">وصول الإشعارات مباشرة على الهاتف:</span>
            </div>
            <button
              onClick={async () => {
                const { playNotificationSound, triggerNativeBrowserNotification } = await import('../utils/notificationSound');
                playNotificationSound();
                triggerNativeBrowserNotification('بذرة غد – إشعار تجريبي 🔔', 'تم تفعيل التنبيهات والصوت على هاتفك بنجاح!');
              }}
              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-[10px] shrink-0 cursor-pointer shadow-2xs"
            >
              تفعيل التنبيه والصوت 🔔
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl text-[11px] font-bold text-center">
            <button
              onClick={() => setFilter('all')}
              className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer truncate ${
                filter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              الكل ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('admin_registrations')}
              className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer truncate flex items-center justify-center gap-1 ${
                filter === 'admin_registrations' ? 'bg-white text-amber-950 shadow-2xs font-black' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>تسجيلات جديدة</span>
              {adminRegistrationsCount > 0 && (
                <span className="bg-amber-600 text-white text-[9px] px-1 py-0.2 rounded-full">
                  {adminRegistrationsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('sessions')}
              className={`py-1.5 px-1 rounded-lg transition-all cursor-pointer truncate ${
                filter === 'sessions' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              الحصص والدعم
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs space-y-2">
              <Bell className="w-8 h-8 mx-auto text-stone-300" />
              <p>لا توجد إشعارات في هذا القسم حالياً.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isAdminItem = isRegistrationNotif(notif);
              return (
                <div
                  key={notif.id}
                  onClick={() => onMarkRead(notif.id)}
                  className={`p-3.5 rounded-2xl border text-xs space-y-2.5 transition-all cursor-pointer ${
                    isAdminItem
                      ? notif.read
                        ? 'bg-amber-50/30 border-amber-200 text-stone-800'
                        : 'bg-amber-50/80 border-amber-300 text-stone-900 shadow-xs ring-1 ring-amber-300/60'
                      : notif.read
                      ? 'bg-stone-50/60 border-stone-200 text-stone-700'
                      : 'bg-emerald-50/50 border-emerald-300 text-stone-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isAdminItem ? (
                        <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <span className="font-bold text-stone-900 truncate">
                        {!notif.read && <span className="w-2 h-2 rounded-full bg-rose-600 inline-block ml-1" />}
                        {notif.title}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-stone-400 shrink-0">{notif.date}</span>
                  </div>

                  {isAdminItem && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-md">
                      <span>🔔 إشعار موجه للإدارة: تسجيل حساب جديد</span>
                    </div>
                  )}

                  <p className="text-stone-700 leading-relaxed font-medium">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100/80 text-[11px]">
                    <span className="text-stone-400">
                      {isAdminItem ? (
                        <span className="text-amber-800 font-bold">إدارة الجمعية 📋</span>
                      ) : (
                        <>الشعبة: <b>{notif.targetStream || 'الكل'}</b></>
                      )}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(notif.id, `${notif.title}\n${notif.message}`);
                        }}
                        className="text-stone-500 hover:text-stone-800 font-semibold flex items-center gap-1 cursor-pointer"
                        title="نسخ تفاصيل الإشعار"
                      >
                        {copiedId === notif.id ? (
                          <>
                            <CheckCheck className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>نسخ</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(notif.message);
                        }}
                        className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>مشاركة</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-100 text-center text-[11px] text-stone-500 bg-stone-50">
          يتم تسجيل وإشعار إدارة الجمعية فورياً عند انضمام أي تلميذ أو أستاذ جديد 🔔
        </div>

      </div>
    </div>
  );
};
