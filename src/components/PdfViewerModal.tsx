import React, { useState } from 'react';
import { StudyResource, BacArchiveItem, SiteSettings } from '../types';
import { generateAndDownloadPdf, printNativeArabicDocument } from '../utils/pdfGenerator';
import { 
  X, 
  FileDown, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  BookOpen, 
  CheckCircle, 
  Award, 
  Layers, 
  Share2, 
  FileText, 
  Calendar, 
  User, 
  Sparkles,
  ArrowDownToLine,
  CheckCircle2
} from 'lucide-react';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource?: StudyResource | null;
  bacArchive?: BacArchiveItem | null;
  siteSettings?: SiteSettings;
  onDownloaded?: (title: string) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  resource,
  bacArchive,
  siteSettings,
  onDownloaded,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'content' | 'solution'>('content');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || (!resource && !bacArchive)) return null;

  const headerTitle = siteSettings?.pdfHeaderTitle || 'جمعية «بذرة غد» الشبانية';
  const headerSubtitle = siteSettings?.pdfHeaderSubtitle || '«شباب اليوم ... قادة الغد» · الموسم الدراسي 2026 / 2027';

  const docTitle = resource?.title || (bacArchive ? `موضوع وحل بكالوريا ${bacArchive.year} - ${bacArchive.subject}` : 'وثيقة رسمية');
  const docSubject = resource?.subject || bacArchive?.subject || 'التعليم الثانوي';
  const docStream = resource?.stream || bacArchive?.stream || 'جميع الشعب';
  const docTeacher = resource?.teacherName || (bacArchive ? 'وزارة التربية الوطنية (الديوان الوطني للامتحانات)' : headerTitle);
  const hasSolution = !!resource?.hasSolution || !!bacArchive;

  const handleDownload = async () => {
    if (resource) {
      await generateAndDownloadPdf({
        title: resource.title,
        subject: resource.subject,
        stream: resource.stream,
        author: resource.teacherName,
        content: resource.contentPreview + '\n\n' + resource.description,
        solution: resource.solutionText,
        pdfDataUrl: resource.pdfDataUrl,
        fileName: resource.pdfFileName || resource.title,
        date: resource.uploadDate,
        customHeaderTitle: headerTitle,
        customHeaderSubtitle: headerSubtitle,
      });
    } else if (bacArchive) {
      const allContent = bacArchive.topics.map(t => 
        `【الموضوع ${t.topicNumber}: ${t.title}】\n` + 
        t.exercises.map((e, idx) => `• تمرين ${idx + 1}: ${e}`).join('\n')
      ).join('\n\n');

      const allSolutions = bacArchive.topics.map(t => 
        `【حل الموضوع ${t.topicNumber}】:\n${t.solutionSummary}\n\nسلالم التنقيط ونقاط التركيز:\n` +
        t.keyPoints.map(kp => `✓ ${kp}`).join('\n')
      ).join('\n\n');

      await generateAndDownloadPdf({
        title: `شهادة البكالوريا دورة ${bacArchive.year} — ${bacArchive.subject}`,
        subject: bacArchive.subject,
        stream: bacArchive.stream,
        author: 'الديوان الوطني للامتحانات والمسابقات',
        content: allContent,
        solution: allSolutions,
        fileName: `BAC_${bacArchive.year}_${bacArchive.subject}_${bacArchive.stream}`,
        customHeaderTitle: headerTitle,
        customHeaderSubtitle: headerSubtitle,
      });
    }

    setDownloadSuccess(true);
    if (onDownloaded) onDownloaded(docTitle);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  const handlePrint = () => {
    if (resource) {
      printNativeArabicDocument({
        title: resource.title,
        subject: resource.subject,
        stream: resource.stream,
        author: resource.teacherName,
        content: resource.contentPreview + '\n\n' + resource.description,
        solution: resource.solutionText,
        fileName: resource.pdfFileName || resource.title,
        date: resource.uploadDate,
      });
    } else if (bacArchive) {
      const allContent = bacArchive.topics.map(t => 
        `【الموضوع ${t.topicNumber}: ${t.title}】\n` + 
        t.exercises.map((e, idx) => `• تمرين ${idx + 1}: ${e}`).join('\n')
      ).join('\n\n');

      const allSolutions = bacArchive.topics.map(t => 
        `【حل الموضوع ${t.topicNumber}】:\n${t.solutionSummary}\n\nسلالم التنقيط ونقاط التركيز:\n` +
        t.keyPoints.map(kp => `✓ ${kp}`).join('\n')
      ).join('\n\n');

      printNativeArabicDocument({
        title: `شهادة البكالوريا دورة ${bacArchive.year} — ${bacArchive.subject}`,
        subject: bacArchive.subject,
        stream: bacArchive.stream,
        author: 'الديوان الوطني للامتحانات والمسابقات',
        content: allContent,
        solution: allSolutions,
        fileName: `BAC_${bacArchive.year}_${bacArchive.subject}_${bacArchive.stream}`,
      });
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs p-2 sm:p-4 md:p-6">
      <div className="min-h-full flex items-center justify-center py-2 sm:py-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full flex flex-col shadow-2xl border border-stone-200 overflow-hidden text-right">
        
        {/* Top Action & Title Bar */}
        <div className="bg-stone-900 text-white p-4 md:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  {docSubject}
                </span>
                <span className="text-[10px] font-semibold text-stone-400">
                  {docStream}
                </span>
              </div>
              <h2 className="text-sm md:text-base font-black truncate text-stone-100 mt-0.5">
                {docTitle}
              </h2>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-1 bg-stone-800/80 rounded-xl p-1 border border-stone-700">
              <button
                onClick={() => setZoomLevel(prev => Math.max(75, prev - 10))}
                title="تصغير"
                className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-stone-700 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-stone-300">
                {zoomLevel}%
              </span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                title="تكبير"
                className="p-1.5 text-stone-300 hover:text-white rounded-lg hover:bg-stone-700 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={handlePrint}
              title="طباعة الوثيقة"
              className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl border border-stone-700 text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline font-bold">طباعة</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>تحميل PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Header Tabs */}
        <div className="bg-stone-50 border-b border-stone-200 px-4 md:px-6 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                activeTab === 'content'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
              }`}
            >
              📄 نص الموضوع والملخص
            </button>
            {hasSolution && (
              <button
                onClick={() => setActiveTab('solution')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                  activeTab === 'solution'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                💡 عناصر الإجابة وسلم التنقيط
              </button>
            )}
          </div>

          <div className="text-stone-500 text-[11px] flex items-center gap-3">
            <span>المؤطر: <b className="text-stone-800">{docTeacher}</b></span>
            {resource?.fileSize && (
              <span>الحجم: <b className="font-mono text-stone-800">{resource.fileSize}</b></span>
            )}
          </div>
        </div>

        {downloadSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-900 font-bold flex items-center gap-2 animate-pulse">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>تم تحميل ملف الـ PDF بنجاح إلى جهازك!</span>
          </div>
        )}

        {/* Modal Main Reader Canvas */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-stone-100/70 space-y-6">
          
          {/* If the resource has an embedded uploaded real PDF DataURL */}
          {resource?.pdfDataUrl && resource.pdfDataUrl.startsWith('data:application/pdf') ? (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-2">
              <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs font-bold text-stone-700">
                <span>ملف PDF مرفوع أصلي ({resource.pdfFileName || 'وثيقة رسمية'})</span>
                <span className="font-mono text-emerald-700">{resource.fileSize}</span>
              </div>
              <iframe
                src={resource.pdfDataUrl}
                title={docTitle}
                className="w-full h-[60vh] rounded-xl border border-stone-200"
              />
            </div>
          ) : (
            /* Styled A4 Document Page Simulation */
            <div 
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className="transition-transform duration-150 max-w-3xl mx-auto bg-white rounded-2xl border border-stone-200 p-6 md:p-10 shadow-md space-y-6"
            >
              {/* Official Algerian Republic Header */}
              <div className="text-center border-b border-stone-200 pb-4 space-y-1">
                <div className="text-[11px] text-stone-500 font-medium">
                  الجمهورية الجزائرية الديمقراطية الشعبية — وزارة التربية الوطنية
                </div>
                <div className="text-sm font-black text-emerald-800">
                  {headerTitle}
                </div>
                <div className="text-[11px] text-emerald-700 font-bold">
                  {headerSubtitle}
                </div>
              </div>

              {/* Title & Metadata Box */}
              <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-700 text-white">
                      {docSubject}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-white text-emerald-900 border border-emerald-200">
                      الشعبة: {docStream}
                    </span>
                  </div>
                  <h1 className="text-lg font-black text-stone-900 mt-1">
                    {docTitle}
                  </h1>
                </div>

                <div className="text-left text-xs text-stone-600 border-r border-emerald-200 pr-4 md:border-r-0 md:pr-0">
                  <div>إعداد وتأطير: <b className="text-stone-900">{docTeacher}</b></div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    تاريخ النشر: {resource?.uploadDate || '2026/2027'}
                  </div>
                </div>
              </div>

              {/* Content Tab: Study Resource */}
              {resource && activeTab === 'content' && (
                <div className="space-y-5 text-stone-800 text-xs md:text-sm leading-relaxed">
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                    <h3 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-emerald-700" />
                      <span>تقديم المحتوى البيداغوجي:</span>
                    </h3>
                    <p className="text-stone-700 leading-relaxed">{resource.description}</p>
                  </div>

                  <div className="p-5 bg-white rounded-xl border border-stone-200 space-y-3">
                    <h3 className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2">
                      مفاهيم الوحدة والتمارين التطبيقية:
                    </h3>
                    <p className="whitespace-pre-line text-stone-700 leading-relaxed font-sans">
                      {resource.contentPreview}
                    </p>
                  </div>

                  {resource.hasSolution && (
                    <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between">
                      <span className="font-bold text-amber-950 text-xs">
                        💡 هذا المورد يحتوي على حل نموذجي مفصل وسلم تنقيط وزاري.
                      </span>
                      <button
                        onClick={() => setActiveTab('solution')}
                        className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        الانتقال إلى الحل
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Solution Tab: Study Resource */}
              {resource && activeTab === 'solution' && (
                <div className="space-y-4 text-stone-800 text-xs md:text-sm">
                  <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
                    <h3 className="font-black text-emerald-950 text-sm flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-emerald-700" />
                      <span>عناصر الإجابة النموذجية وسلم التنقيط المعتمد:</span>
                    </h3>
                    <p className="whitespace-pre-line text-stone-700 leading-relaxed font-sans">
                      {resource.solutionText || 'الحل النموذجي مرفق ضمن الملف الكامل المطبوع.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Bac Archive Content */}
              {bacArchive && (
                <div className="space-y-6 text-xs md:text-sm">
                  {bacArchive.topics.map((t) => (
                    <div key={t.topicNumber} className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2 font-bold text-stone-900">
                        <span>{t.title}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono text-xs">
                          الموضوع {t.topicNumber}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-bold text-stone-700 block">نص التمارين:</span>
                        <ul className="space-y-1 text-stone-600 list-disc list-inside">
                          {t.exercises.map((e, idx) => (
                            <li key={idx}>{e}</li>
                          ))}
                        </ul>
                      </div>

                      {activeTab === 'solution' && (
                        <div className="p-3.5 bg-white rounded-xl border border-stone-200 space-y-2 mt-3">
                          <span className="font-bold text-emerald-800 block">سلم التنقيط والحل النموذجي:</span>
                          <p className="text-stone-700 text-xs">{t.solutionSummary}</p>
                          <ul className="text-[11px] text-stone-500 space-y-0.5">
                            {t.keyPoints.map((kp, idx) => (
                              <li key={idx}>• {kp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Official Seal and Signature */}
              <div className="pt-6 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
                <div>
                  <div className="font-bold text-stone-800">{headerTitle}</div>
                  <div>المكتب التربوي والبيداغوجي — ولاية إن صالح</div>
                </div>

                <div className="text-left font-serif">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-600/40 text-emerald-800 flex items-center justify-center text-[10px] font-bold text-center p-1 leading-tight rotate-12">
                    ختم الاعتماد<br/>بذرة غد
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs text-stone-500 text-center sm:text-right">
            يمكنك حفظ الملف بصيغة PDF وطباعته مجاناً في أي وقت.
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors bg-stone-100 sm:bg-transparent rounded-xl text-center"
            >
              إغلاق
            </button>
            <button
              onClick={handleDownload}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer text-center"
            >
              <FileDown className="w-4 h-4" />
              <span>تحميل المستند الآن بصيغة PDF</span>
            </button>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};
