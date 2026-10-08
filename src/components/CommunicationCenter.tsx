import React, { useState } from 'react';
import { SupportSession, BacStream, AppNotification } from '../types';
import { api } from '../api';
import { 
  Send, 
  MessageSquare, 
  Share2, 
  Copy, 
  Check, 
  Bell, 
  Clock, 
  MapPin, 
  Users,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface CommunicationCenterProps {
  sessions: SupportSession[];
  onBroadcastNotification: (notif: AppNotification) => void;
}

export const CommunicationCenter: React.FC<CommunicationCenterProps> = ({
  sessions,
  onBroadcastNotification,
}) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessions[0]?.id || '');
  const activeSession = sessions.find(s => s.id === selectedSessionId) || sessions[0];

  const defaultReminder = activeSession
    ? `🔔 تذكير: حصة ${activeSession.subject} يوم ${activeSession.timeText} بـ ${activeSession.location}. يرجى إحضار كراس المحاولات وسلسلة التمارين.`
    : `🔔 تذكير: حصة الفيزياء يوم الخميس بعد صلاة المغرب بدار الشباب.`;

  const [messageText, setMessageText] = useState(defaultReminder);
  const [copied, setCopied] = useState(false);
  const [inAppSent, setInAppSent] = useState(false);

  // Quick preset templates
  const presets = [
    {
      title: 'تذكير حصة الخميس بعد صلاة المغرب',
      text: '🔔 تذكير: حصة الفيزياء يوم الخميس بعد صلاة المغرب بدار الشباب.',
    },
    {
      title: 'تذكير حصة الرياضيات والمناقشة البيانية',
      text: '🔔 تذكير لتلاميذ بكالوريا 2027: حصة الرياضيات غداً على الساعة 17:30 بدار الشباب الشهيد بوجمعة. سنقوم بحل مسألة شاملة في الدوال اللوغاريتمية.',
    },
    {
      title: 'إشعار اختبار تجريبي إلكتروني',
      text: '📝 تنبيه هام: تم إطلاق الاختبار التجريبي الإلكتروني لمادة الرياضيات (20 سؤالاً، 60 دقيقة). يمكنكم الدخول للمنصة وإجراء الاختبار مع التصحيح الفوري.',
    },
    {
      title: 'تنبيه للأولياء بنسبة الحضور',
      text: '📋 جمعية بذرة غد – بكالوريا 2027: نحيط أولياء الأمور الكرام علماً بأنه تم تحديث سجل الحضور الأسبوعي لدروس الدعم، يمكنكم الاطلاع على البطاقة الرقمية.',
    },
  ];

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    const ses = sessions.find(s => s.id === sessionId);
    if (ses) {
      setMessageText(`🔔 تذكير: حصة ${ses.subject} (${ses.title}) يوم ${ses.timeText} بـ ${ses.location} مع الأستاذ ${ses.teacherName}.`);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);

  const handleSendTelegram = async () => {
    setTelegramStatus('جارٍ البث...');
    const res = await api.broadcastTelegram(messageText);
    if (res.success) {
      setTelegramStatus('تم بث الإعلان للقناة بنجاح!');
      setTimeout(() => setTelegramStatus(null), 3500);
    } else {
      setTelegramStatus(null);
      const encoded = encodeURIComponent(messageText);
      const a = document.createElement('a');
      a.href = `https://t.me/share/url?url=&text=${encoded}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    }
  };

  const handleSendInApp = () => {
    const notif: AppNotification = {
      id: `notif-${Date.now().toString().slice(-4)}`,
      title: 'تذكير جديد من جمعية بذرة غد',
      message: messageText,
      date: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      type: 'session',
      targetStream: activeSession ? activeSession.stream : 'الكل',
      read: false,
    };

    onBroadcastNotification(notif);
    setInAppSent(true);
    setTimeout(() => setInAppSent(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="mb-8 border-b border-stone-200 pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            مركز التواصل والإشعارات (WhatsApp / Telegram)
          </h1>
          <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold">
            إرسال فوري
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          إرسال تذكيرات بمواعيد الحصص والاختبارات للتلاميذ والأولياء بضغطة زر واحدة عبر منصات المراسلة الفورية
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Composer */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          
          {/* Quick Select Session */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5">
              توليد تذكير آلي من برنامج الحصص القادمة:
            </label>
            <select
              value={selectedSessionId}
              onChange={(e) => handleSelectSession(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-800 focus:outline-hidden"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject}: {s.title} ({s.timeText})
                </option>
              ))}
            </select>
          </div>

          {/* Message Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700">
                نص رسالة التذكير / الإشعار:
              </label>
              <button
                onClick={handleCopy}
                className="text-xs text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
              </button>
            </div>

            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
              className="w-full p-3.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:outline-hidden text-stone-900 leading-relaxed font-medium"
            />
          </div>

          {/* Action Buttons: WhatsApp / Telegram / In-App */}
          <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-3">
            
            {/* WhatsApp */}
            <button
              onClick={handleSendWhatsApp}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>إرسال عبر WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={handleSendTelegram}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{telegramStatus || 'بث عبر Telegram'}</span>
            </button>

            {/* In-App Notification */}
            <button
              onClick={handleSendInApp}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 active:bg-black text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>{inAppSent ? 'تم بث الإشعار بنجاح!' : 'بث إشعار داخل التطبيق'}</span>
            </button>

          </div>

          {/* Quick Notice Example Banner */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950">
            <span className="font-bold block mb-1">النموذج المعتمد في المبادرة:</span>
            <code className="text-emerald-900 font-mono text-[11px] block bg-white/80 p-2 rounded-md">
              🔔 تذكير: حصة الفيزياء يوم الخميس بعد صلاة المغرب بدار الشباب.
            </code>
          </div>

        </div>

        {/* Right Column: Pre-configured Template Switcher */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3">
          <h3 className="font-bold text-stone-900 text-xs">نماذج رسائل وتذكيرات جاهزة:</h3>
          <p className="text-[11px] text-stone-500">انقر على أي نموذج لاعتماده فوراً في الإرسال:</p>

          <div className="space-y-2">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => setMessageText(preset.text)}
                className="w-full text-right p-3 rounded-xl border border-stone-100 hover:border-emerald-300 hover:bg-emerald-50/40 text-xs transition-colors cursor-pointer group"
              >
                <span className="font-bold text-stone-800 group-hover:text-emerald-900 block mb-1">
                  {preset.title}
                </span>
                <span className="text-[11px] text-stone-500 line-clamp-2">
                  {preset.text}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-stone-500 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-emerald-700" />
            <span>متوافق مع الهواتف الذكية وتطبيق WhatsApp Web</span>
          </div>
        </div>

      </div>

    </div>
  );
};
