import React from 'react';
import { AppNotification } from '../types';
import { X, Bell, Check, Share2, Calendar, BookOpen, AlertCircle } from 'lucide-react';

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
  if (!isOpen) return null;

  const handleShare = (msg: string) => {
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col text-right">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">إشعارات وتنبيهات الحصص</h2>
              <span className="text-[11px] text-stone-500">بذرة غد – بكالوريا 2027</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer"
            >
              تحديد الكل كمقروء
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              لا توجد إشعارات جديدة حالياً.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkRead(notif.id)}
                className={`p-3.5 rounded-xl border text-xs space-y-2 transition-colors cursor-pointer ${
                  notif.read
                    ? 'bg-stone-50/60 border-stone-200 text-stone-700'
                    : 'bg-emerald-50/40 border-emerald-300 text-stone-900 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-stone-900">
                    {!notif.read && <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />}
                    {notif.title}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400">{notif.date}</span>
                </div>

                <p className="text-stone-600 leading-relaxed font-medium">
                  {notif.message}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
                  <span className="text-stone-400">
                    الشعبة: <b>{notif.targetStream || 'الكل'}</b>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShare(notif.message);
                    }}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>مشاركة عبر WhatsApp</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-100 text-center text-[11px] text-stone-400 bg-stone-50">
          يتم إرسال التذكيرات آلياً قبل موعد الحصص بدار الشباب
        </div>

      </div>
    </div>
  );
};
