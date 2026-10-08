import React, { useState } from 'react';
import { StudyResource, BacArchiveItem, BacStream, AppUser, SiteSettings } from '../types';
import { generateAndDownloadPdf } from '../utils/pdfGenerator';
import { PdfViewerModal } from './PdfViewerModal';
import { 
  BookOpen, 
  FileDown, 
  CheckCircle, 
  HelpCircle, 
  Eye, 
  Sparkles, 
  Filter, 
  Search, 
  ExternalLink, 
  X, 
  Award,
  Lock,
  FileText,
  DownloadCloud,
  FileUp,
  Tag,
  Clock,
  Layers,
  Printer,
  EyeOff,
  Trash2,
  ShieldAlert
} from 'lucide-react';

interface ResourcesViewProps {
  resources: StudyResource[];
  bacArchives: BacArchiveItem[];
  currentUser: AppUser | null;
  siteSettings?: SiteSettings;
  onOpenTeacherSpace: () => void;
  onOpenControlPanel?: () => void;
  onOpenAuth: () => void;
  onIncrementDownload?: (resourceId: string) => void;
  onDeleteResource?: (resourceId: string) => void;
  onToggleHideResource?: (resourceId: string) => void;
}

const ALL_STREAMS: BacStream[] = [
  'السنة الرابعة متوسط (BEM)',
  'علوم تجريبية',
  'رياضيات',
  'تقني رياضي',
  'تسيير واقتصاد',
  'آداب وفلسفة',
  'لغات أجنبية',
];

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  resources,
  bacArchives,
  currentUser,
  siteSettings,
  onOpenTeacherSpace,
  onOpenControlPanel,
  onOpenAuth,
  onIncrementDownload,
  onDeleteResource,
  onToggleHideResource,
}) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'bac_archives' | 'bem_archives'>('resources');
  const [selectedLevel, setSelectedLevel] = useState<'all' | 'BAC' | 'BEM'>('all');
  const [streamFilter, setStreamFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  // PDF Viewer Modal State
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerResource, setViewerResource] = useState<StudyResource | null>(null);
  const [viewerBacArchive, setViewerBacArchive] = useState<BacArchiveItem | null>(null);

  const isManager = currentUser?.role === 'teacher' || currentUser?.role === 'association_admin';

  // Filter study resources by level, stream, search query, and resource type
  const filteredResources = resources.filter((r) => {
    // Hidden resources only visible to teachers & admin
    if (!isManager && r.isHidden) return false;

    const isBemRes = r.stream.includes('BEM') || r.educationLevel === 'BEM';
    const matchesLevel = 
      selectedLevel === 'all' ||
      (selectedLevel === 'BEM' && isBemRes) ||
      (selectedLevel === 'BAC' && !isBemRes);

    const matchesStream = streamFilter === 'all' || r.stream === streamFilter;
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      r.title.toLowerCase().includes(query) ||
      r.subject.toLowerCase().includes(query) ||
      r.teacherName.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query);
    return matchesLevel && matchesStream && matchesType && matchesSearch;
  });

  // Filter past baccalaureate archives (BAC only)
  const filteredBacArchives = bacArchives.filter((b) => {
    const isBac = b.examType !== 'BEM' && !b.stream.includes('BEM');
    if (!isBac) return false;
    const matchesStream = streamFilter === 'all' || b.stream === streamFilter;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      b.subject.toLowerCase().includes(query) ||
      b.year.toString().includes(query) ||
      b.stream.toLowerCase().includes(query);
    return matchesStream && matchesSearch;
  });

  // Filter past BEM archives (BEM only)
  const filteredBemArchives = bacArchives.filter((b) => {
    const isBem = b.examType === 'BEM' || b.stream.includes('BEM');
    if (!isBem) return false;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      b.subject.toLowerCase().includes(query) ||
      b.year.toString().includes(query) ||
      b.stream.toLowerCase().includes(query);
    return matchesSearch;
  });

  // Real PDF Download execution for study resources
  const handleDownloadResource = async (res: StudyResource) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    await generateAndDownloadPdf({
      title: res.title,
      subject: res.subject,
      stream: res.stream,
      author: res.teacherName,
      content: res.contentPreview + '\n\n' + res.description,
      solution: res.solutionText,
      pdfDataUrl: res.pdfDataUrl,
      fileName: res.pdfFileName || res.title,
      date: res.uploadDate,
      customHeaderTitle: siteSettings?.pdfHeaderTitle,
      customHeaderSubtitle: siteSettings?.pdfHeaderSubtitle,
    });

    setDownloadFeedback(`✓ تم حفظ ملف الـ PDF «${res.title}» مباشرة على جهازك!`);
    if (onIncrementDownload) {
      onIncrementDownload(res.id);
    }
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

  // Real PDF Download for official Bac or BEM exams
  const handleDownloadBacArchive = async (archive: BacArchiveItem) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const isBemArchive = archive.examType === 'BEM' || archive.stream.includes('BEM');
    const examLabel = isBemArchive ? 'شهادة التعليم المتوسط' : 'شهادة البكالوريا';
    const filePrefix = isBemArchive ? 'BEM' : 'BAC';

    const allContent = archive.topics.map(t => 
      `【الموضوع ${t.topicNumber}: ${t.title}】\n` + 
      t.exercises.map((e, idx) => `• تمرين ${idx + 1}: ${e}`).join('\n')
    ).join('\n\n');

    const allSolutions = archive.topics.map(t => 
      `【حل الموضوع ${t.topicNumber}】:\n${t.solutionSummary}\n\nسلالم التنقيط ونقاط التركيز:\n` +
      t.keyPoints.map(kp => `✓ ${kp}`).join('\n')
    ).join('\n\n');

    await generateAndDownloadPdf({
      title: `${examLabel} دورة ${archive.year} — ${archive.subject}`,
      subject: archive.subject,
      stream: archive.stream,
      author: 'الديوان الوطني للامتحانات والمسابقات',
      content: allContent,
      solution: allSolutions,
      fileName: `${filePrefix}_${archive.year}_${archive.subject}_${archive.stream}`,
      customHeaderTitle: siteSettings?.pdfHeaderTitle,
      customHeaderSubtitle: siteSettings?.pdfHeaderSubtitle,
    });

    setDownloadFeedback(`✓ تم تحميل موضوع «${examLabel} ${archive.year}» بصيغة PDF على جهازك!`);
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

  // Open In-App PDF Reader
  const handleOpenViewer = (res: StudyResource) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setViewerResource(res);
    setViewerBacArchive(null);
    setViewerOpen(true);
  };

  const handleOpenBacViewer = (archive: BacArchiveItem) => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setViewerBacArchive(archive);
    setViewerResource(null);
    setViewerOpen(true);
  };

  const totalDownloads = resources.reduce((acc, r) => acc + (r.downloadCount || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
              المكتبة التربوية الرسمية · BAC & BEM
            </span>
            <span className="text-stone-400 text-xs">·</span>
            <span className="text-stone-500 text-xs font-mono">
              {resources.length} ملف PDF متاح
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            مكتبة ملفات الـ PDF وحوليات البكالوريا والتعليم المتوسط
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            ملخصات الأساتذة وسلاسل التمارين، حوليات البكالوريا (BAC) وحوليات شهادة التعليم المتوسط (BEM) مع سلالم التنقيط الرسمية
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-Tabs Switcher */}
          <div className="inline-flex p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'resources'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ملخصات وتمارين PDF
            </button>
            <button
              onClick={() => setActiveTab('bac_archives')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'bac_archives'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              حوليات البكالوريا (BAC)
            </button>
            <button
              onClick={() => setActiveTab('bem_archives')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'bem_archives'
                  ? 'bg-white text-amber-900 shadow-xs font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              حوليات المتوسط (BEM)
            </button>
          </div>

          {/* Action button to add PDF for Teachers or Admin */}
          {currentUser?.role === 'teacher' && (
            <button
              onClick={onOpenTeacherSpace}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>+ رفع ملخص PDF كأستاذ</span>
            </button>
          )}

          {currentUser?.role === 'association_admin' && onOpenControlPanel && (
            <button
              onClick={onOpenControlPanel}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <FileUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ إضافة ملف PDF للإدارة</span>
            </button>
          )}
        </div>
      </div>

      {/* Auth Warning Banner */}
      {!currentUser && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-950">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              تحميل وقراءة ملفات الـ PDF الكاملة وسلالم التنقيط متاح للمسجلين في المنصة فقط (حسابات مجانية لجميع التلاميذ والأساتذة).
            </span>
          </div>
          <button
            onClick={onOpenAuth}
            className="px-4 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold transition-colors cursor-pointer shrink-0"
          >
            تسجيل الدخول لتحميل الـ PDF
          </button>
        </div>
      )}

      {/* Download Feedback Banner */}
      {downloadFeedback && (
        <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950 font-bold flex items-center gap-2.5 shadow-xs animate-pulse">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>تم تحميل ملف «{downloadFeedback}» بصيغة PDF بنجاح إلى جهازك!</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 mb-6 space-y-3 shadow-xs">
        {/* Level Tabs for Study Resources */}
        {activeTab === 'resources' && (
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <span className="text-xs font-bold text-stone-500 ml-1">تصفية حسب الشهادة:</span>
            <div className="inline-flex p-1 bg-stone-100 rounded-xl text-xs">
              <button
                onClick={() => { setSelectedLevel('all'); setStreamFilter('all'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  selectedLevel === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                الكل ({resources.length})
              </button>
              <button
                onClick={() => { setSelectedLevel('BAC'); setStreamFilter('all'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedLevel === 'BAC' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                <span>🎓 بكالوريا BAC</span>
              </button>
              <button
                onClick={() => { setSelectedLevel('BEM'); setStreamFilter('السنة الرابعة متوسط (BEM)'); }}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  selectedLevel === 'BEM' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600'
                }`}
              >
                <span>📘 تعليم متوسط BEM</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالعنوان، المادة (رياضيات، فيزياء...)، أو اسم الأستاذ..."
              className="w-full pr-9 pl-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Stream Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden"
            >
              <option value="all">كل الشعب ({resources.length})</option>
              {ALL_STREAMS
                .filter((s) => {
                  if (selectedLevel === 'BEM') return s.includes('BEM');
                  if (selectedLevel === 'BAC') return !s.includes('BEM');
                  return true;
                })
                .map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
            </select>

            {activeTab === 'resources' && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden"
              >
                <option value="all">كل الأنواع</option>
                <option value="summary">ملخصات دروس</option>
                <option value="exercise">سلاسل تمارين</option>
                <option value="cheatsheet">بطاقات استذكار</option>
              </select>
            )}
          </div>
        </div>

        {/* Quick Stream Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
          <span className="text-[11px] text-stone-400 shrink-0 ml-1">تصفية سريعة:</span>
          <button
            onClick={() => setStreamFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
              streamFilter === 'all'
                ? 'bg-emerald-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            الكل
          </button>
          {ALL_STREAMS
            .filter((st) => {
              if (selectedLevel === 'BEM') return st.includes('BEM');
              if (selectedLevel === 'BAC') return !st.includes('BEM');
              return true;
            })
            .map((st) => (
              <button
                key={st}
                onClick={() => setStreamFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  streamFilter === st
                    ? 'bg-emerald-800 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st}
              </button>
            ))}
        </div>
      </div>

      {/* Tab 1: Educational PDF Resources */}
      {activeTab === 'resources' && (
        <div>
          {filteredResources.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-300 p-8">
              <FileText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <h3 className="font-bold text-stone-700 text-sm">لا توجد ملفات مطابقة لبحثك</h3>
              <p className="text-xs text-stone-500 mt-1">جرّب تغيير كلمات البحث أو اختيار كل الشعب.</p>
              <button
                onClick={() => { setStreamFilter('all'); setSearchQuery(''); setTypeFilter('all'); }}
                className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
              >
                إعادة ضبط الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredResources.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 hover:shadow-sm transition-all"
                >
                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(res.stream.includes('BEM') || res.educationLevel === 'BEM') ? (
                          <span className="font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[10px] border border-amber-300">
                            BEM 4 متوسط
                          </span>
                        ) : (
                          <span className="font-extrabold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-md text-[10px] border border-emerald-300">
                            BAC 3 ثانوي
                          </span>
                        )}

                        <span className="font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md text-[11px]">
                          {res.subject}
                        </span>
                        <span className="text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {res.type === 'summary' ? 'ملخص' : res.type === 'exercise' ? 'تمارين' : 'بطاقة'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <span>PDF</span>
                        <span>{res.fileSize}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-stone-900 text-sm leading-snug mb-2 line-clamp-2">
                      {res.title}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <span>الأستاذ: <b className="text-stone-800">{res.teacherName}</b></span>
                      <span>الشعبة: <b className="text-stone-800">{res.stream}</b></span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <DownloadCloud className="w-3 h-3 text-stone-400" />
                        <span>{res.downloadCount} تحميلة</span>
                      </span>
                      <span>{res.uploadDate}</span>
                    </div>
                  </div>

                  {/* Actions: Preview Reader, Download PDF & Manager Controls */}
                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenViewer(res)}
                      className="flex-1 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {currentUser ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                      <span>معاينة وقراءة</span>
                    </button>

                    <button
                      onClick={() => handleDownloadResource(res)}
                      className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>تحميل PDF</span>
                    </button>

                    {/* Manager Exclusive: Hide / Delete (Teachers & Admin only) */}
                    {isManager && (
                      <div className="flex items-center gap-1 shrink-0 border-r border-stone-200 pr-1 mr-1">
                        {onToggleHideResource && (
                          <button
                            onClick={() => onToggleHideResource(res.id)}
                            title={res.isHidden ? 'إظهار الملف للتلاميذ' : 'إخفاء الملف عن التلاميذ'}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              res.isHidden 
                                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
                                : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                            }`}
                          >
                            {res.isHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {onDeleteResource && (
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف ملف «${res.title}» نهائياً؟`)) {
                                onDeleteResource(res.id);
                              }
                            }}
                            title="حذف الملف نهائياً (خاص بالأساتذة والإدارة)"
                            className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Past Baccalaureate Official Exams */}
      {activeTab === 'bac_archives' && (
        <div className="space-y-5">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-center justify-between">
            <div>
              <span className="font-bold block text-sm">مواضيع شهادة البكالوريا الرسمية للجمهورية الجزائرية</span>
              <span className="text-emerald-800">
                مواضيع الدورات السابقة كاملة مع حلولها المعتمدة من وزارة التربية وسلالم التنقيط الدقيقة بصيغة PDF.
              </span>
            </div>
            <Award className="w-8 h-8 text-emerald-700 shrink-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredBacArchives.map((archive) => (
              <div
                key={archive.id}
                className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black font-mono text-emerald-800">
                      BAC {archive.year}
                    </span>
                    <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-md">
                      {archive.subject}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-stone-500">{archive.stream}</span>
                </div>

                {/* Topics summary */}
                <div className="space-y-3">
                  {archive.topics.map((t) => (
                    <div key={t.topicNumber} className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1.5 text-xs">
                      <div className="font-bold text-stone-900 flex items-center justify-between">
                        <span>{t.title}</span>
                        <span className="font-mono text-[10px] text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                          الموضوع {t.topicNumber}
                        </span>
                      </div>

                      <ul className="text-stone-600 text-[11px] list-disc list-inside space-y-0.5">
                        {t.exercises.map((ex, i) => (
                          <li key={i} className="line-clamp-1">{ex}</li>
                        ))}
                      </ul>

                      <div className="pt-1.5 text-[11px] text-emerald-900 font-medium">
                        💡 {t.solutionSummary}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenBacViewer(archive)}
                    className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {currentUser ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                    <span>قراءة الموضوعين والحل</span>
                  </button>

                  <button
                    onClick={() => handleDownloadBacArchive(archive)}
                    className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>تحميل PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Past BEM Official Exams */}
      {activeTab === 'bem_archives' && (
        <div className="space-y-5">
          <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-2xl text-xs text-amber-950 flex items-center justify-between shadow-xs">
            <div>
              <span className="font-extrabold block text-sm text-amber-950">
                مواضيع شهادة التعليم المتوسط (BEM) الرسمية للجمهورية الجزائرية
              </span>
              <span className="text-amber-800">
                مواضيع الدورات السابقة لشهادة التعليم المتوسط مع الحلول المعتمدة من وزارة التربية وسلالم التنقيط الدقيقة بصيغة PDF للتحميل المباشر.
              </span>
            </div>
            <Award className="w-8 h-8 text-amber-600 shrink-0" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredBemArchives.map((archive) => (
              <div
                key={archive.id}
                className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-4 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black font-mono text-amber-800">
                      BEM {archive.year}
                    </span>
                    <span className="text-xs font-bold text-stone-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {archive.subject}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-stone-500">السنة الرابعة متوسط</span>
                </div>

                {/* Topics summary */}
                <div className="space-y-3">
                  {archive.topics.map((t) => (
                    <div key={t.topicNumber} className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1.5 text-xs">
                      <div className="font-bold text-stone-900 flex items-center justify-between">
                        <span>{t.title}</span>
                        <span className="font-mono text-[10px] text-amber-700 bg-white px-2 py-0.5 rounded-md border border-stone-200">
                          دورة {archive.year}
                        </span>
                      </div>

                      <ul className="text-stone-600 text-[11px] list-disc list-inside space-y-0.5">
                        {t.exercises.map((ex, i) => (
                          <li key={i} className="line-clamp-1">{ex}</li>
                        ))}
                      </ul>

                      <div className="pt-1.5 text-[11px] text-amber-900 font-medium">
                        💡 {t.solutionSummary}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenBacViewer(archive)}
                    className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {currentUser ? <Eye className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
                    <span>قراءة الموضوع والحل</span>
                  </button>

                  <button
                    onClick={() => handleDownloadBacArchive(archive)}
                    className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>تحميل PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In-App PDF Reader Modal */}
      <PdfViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        resource={viewerResource}
        bacArchive={viewerBacArchive}
        siteSettings={siteSettings}
        onDownloaded={(title) => {
          setDownloadFeedback(title);
          if (viewerResource && onIncrementDownload) onIncrementDownload(viewerResource.id);
          setTimeout(() => setDownloadFeedback(null), 3000);
        }}
      />

    </div>
  );
};
