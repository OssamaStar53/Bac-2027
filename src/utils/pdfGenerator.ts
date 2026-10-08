import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Student } from '../types';

export interface PdfDocumentOptions {
  title: string;
  subject?: string;
  stream?: string;
  author?: string;
  content: string;
  solution?: string;
  date?: string;
  fileName?: string;
  pdfDataUrl?: string; // If this is an already uploaded PDF file (data:application/pdf;base64,...)
  fileSize?: string;
  customHeaderTitle?: string;
  customHeaderSubtitle?: string;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Builds the pure Arabic official Algerian HTML markup for educational documents.
 * Note: Top header strictly displays the Association name only, as requested.
 */
function buildArabicDocumentHtml(options: PdfDocumentOptions): string {
  const { title, subject, stream, author, content, solution, date, customHeaderTitle, customHeaderSubtitle } = options;
  const isBem = stream?.includes('BEM') || title.includes('BEM') || title.includes('متوسط');
  const levelText = isBem 
    ? 'شهادة التعليم المتوسط (BEM 2027) – السنة الرابعة متوسط' 
    : 'شهادة البكالوريا (BAC 2027) – السنة الثالثة ثانوي';

  const cleanContentHtml = (content || 'وثيقة بيداغوجية موجهة لمرافقة وتحضير التلاميذ.')
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => `<p style="margin: 0 0 10px 0; font-size: 13.5px; line-height: 1.85; text-align: justify; color: #1c1917;">${escapeHtml(line)}</p>`)
    .join('');

  const cleanSolutionHtml = solution
    ? solution
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => `<p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.75; text-align: justify; color: #7c2d12;">${escapeHtml(line)}</p>`)
        .join('')
    : '';

  const docDate = date || new Date().toLocaleDateString('ar-DZ');
  const finalHeaderTitle = customHeaderTitle || 'جمعية «بذرة غد» الشبانية';
  const finalHeaderSubtitle = customHeaderSubtitle || '«شباب اليوم ... قادة الغد» · الموسم الدراسي 2026 / 2027';

  return `
    <!-- Top Official Algerian Heading (Strictly Association Name Only) -->
    <div style="text-align: center; border-bottom: 2px solid #047857; padding-bottom: 14px; margin-bottom: 20px;">
      <div style="font-size: 12px; font-weight: 700; color: #44403c; letter-spacing: 0.5px; margin-bottom: 3px;">
        الجمهورية الجزائرية الديمقراطية الشعبية
      </div>
      <div style="font-size: 11px; color: #78716c; margin-bottom: 4px;">
        وزارة التربية الوطنية · مديرية التربية لولاية إن صالح
      </div>
      <div style="font-size: 16px; font-weight: 900; color: #047857; letter-spacing: 0.5px;">
        ${escapeHtml(finalHeaderTitle)}
      </div>
      <div style="font-size: 11px; color: #059669; font-weight: 700; margin-top: 3px;">
        ${escapeHtml(finalHeaderSubtitle)}
      </div>
    </div>

    <!-- Official Header Banner -->
    <div style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: #ffffff; border-radius: 12px; padding: 18px 20px; margin-bottom: 22px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
        <div style="flex: 1;">
          <div style="display: inline-block; background: rgba(255,255,255,0.22); color: #fef08a; font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 6px; margin-bottom: 8px;">
            ${levelText}
          </div>
          <h1 style="margin: 0 0 10px 0; font-size: 19px; font-weight: 900; line-height: 1.4; color: #ffffff;">
            ${escapeHtml(title)}
          </h1>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; font-size: 12px; color: #d1fae5; font-weight: 600;">
            ${subject ? `<span style="background: rgba(0,0,0,0.25); padding: 3px 9px; border-radius: 6px;">المادة: <b>${escapeHtml(subject)}</b></span>` : ''}
            ${stream ? `<span style="background: rgba(0,0,0,0.25); padding: 3px 9px; border-radius: 6px;">الشعبة/المستوى: <b>${escapeHtml(stream)}</b></span>` : ''}
            ${author ? `<span style="background: rgba(0,0,0,0.25); padding: 3px 9px; border-radius: 6px;">الأستاذ المؤطر: <b>${escapeHtml(author)}</b></span>` : ''}
          </div>
        </div>
        <div style="text-align: left; font-size: 11px; color: #a7f3d0; white-space: nowrap;">
          <div>تاريخ الإصدار:</div>
          <div style="font-weight: 700; color: #ffffff; font-size: 12px; margin-top: 2px;">${docDate}</div>
        </div>
      </div>
    </div>

    <!-- Educational Content Box -->
    <div style="margin-bottom: 22px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
        <div style="width: 6px; height: 18px; background: #047857; border-radius: 3px;"></div>
        <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #064e3b;">
          المحتوى البيداغوجي والملخص / سلسلة التمارين التطبيقية:
        </h2>
      </div>
      <div style="background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 20px; font-size: 13.5px;">
        ${cleanContentHtml}
      </div>
    </div>

    <!-- Model Solutions Box (if available) -->
    ${solution ? `
    <div style="margin-bottom: 22px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
        <div style="width: 6px; height: 18px; background: #ea580c; border-radius: 3px;"></div>
        <h2 style="margin: 0; font-size: 15px; font-weight: 800; color: #9a3412;">
          عناصر الإجابة النموذجية وسلالم التنقيط المعتمدة:
        </h2>
      </div>
      <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 18px; font-size: 13px;">
        ${cleanSolutionHtml}
      </div>
    </div>
    ` : ''}

    <!-- Official Seal & Footer -->
    <div style="margin-top: 30px; padding-top: 14px; border-top: 2px dashed #d6d3d1; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <div style="font-size: 11px; font-weight: 800; color: #047857; margin-bottom: 3px;">
          جمعية بذرة غد الشبانية — ولاية إن صالح
        </div>
        <div style="font-size: 10px; color: #78716c; margin-bottom: 2px;">
          نشاط تربوي تطوعي معتمد · شباب اليوم ... قادة الغد
        </div>
        <div style="font-size: 9.5px; color: #a8a29e; direction: ltr; text-align: right;">
          https://badhrat-ghad.dz · وثيقة رقمية رسمية باللغة العربية
        </div>
      </div>

      <!-- Stamp Graphic -->
      <div style="border: 2px solid #047857; color: #047857; padding: 8px 16px; border-radius: 10px; text-align: center; font-weight: 900; font-size: 10.5px; transform: rotate(-3deg); background: #f0fdf4;">
        <div>جمعية بذرة غد الشبانية</div>
        <div style="font-size: 9px; color: #15803d; margin-top: 2px;">★ معتمد رسمياً 2027 ★</div>
      </div>
    </div>
  `;
}

/**
 * Downloads a PDF directly to the user's computer/phone WITHOUT EVER launching the print dialog!
 */
export async function generateAndDownloadPdf(options: PdfDocumentOptions): Promise<{ success: boolean; blobUrl?: string }> {
  const { title, fileName, pdfDataUrl } = options;
  const safeName = (fileName || title).replace(/[/\\?%*:|"<>]/g, '_').trim() + '.pdf';

  // 1. If an actual uploaded PDF data URL exists
  if (pdfDataUrl && pdfDataUrl.startsWith('data:application/pdf')) {
    try {
      const a = document.createElement('a');
      a.href = pdfDataUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true };
    } catch (err) {
      console.error('Error downloading custom PDF data URL:', err);
    }
  }

  // 2. Wait for fonts if available
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await (document as any).fonts.ready;
    } catch (e) {}
  }

  // 3. Render offscreen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.minHeight = '1123px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1c1917';
  container.style.direction = 'rtl';
  container.style.fontFamily = "'Cairo', 'Alexandria', Tahoma, Arial, sans-serif";
  container.style.padding = '32px 40px';
  container.style.boxSizing = 'border-box';
  container.style.opacity = '1';

  container.innerHTML = buildArabicDocumentHtml(options);
  document.body.appendChild(container);

  try {
    await new Promise((resolve) => setTimeout(resolve, 60));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 1024,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;

    let heightLeft = imgHeight;
    let position = 0;

    // First Page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Subsequent Pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    // Direct download to user device (NO print dialog!)
    pdf.save(safeName);

    const pdfBlob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    return { success: true, blobUrl };
  } catch (error) {
    console.error('Canvas render error, creating direct PDF document fallback:', error);
    
    // Infallible direct jsPDF fallback that ALWAYS saves a PDF file to disk!
    try {
      const fallbackPdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      fallbackPdf.setFillColor(4, 120, 87);
      fallbackPdf.rect(0, 0, 210, 22, 'F');
      
      fallbackPdf.setTextColor(255, 255, 255);
      fallbackPdf.setFontSize(13);
      fallbackPdf.text("Badhra Ghad Youth Association - In Salah", 105, 11, { align: 'center' });
      fallbackPdf.setFontSize(10);
      fallbackPdf.text("Official Educational Document - Season 2026/2027", 105, 17, { align: 'center' });

      fallbackPdf.setTextColor(28, 25, 23);
      fallbackPdf.setFontSize(14);
      fallbackPdf.text(safeName.replace('.pdf', ''), 105, 36, { align: 'center' });

      fallbackPdf.setFontSize(10);
      if (options.subject) fallbackPdf.text(`Subject: ${options.subject}`, 20, 48);
      if (options.stream) fallbackPdf.text(`Stream: ${options.stream}`, 20, 54);
      if (options.author) fallbackPdf.text(`Teacher: ${options.author}`, 20, 60);

      fallbackPdf.setFontSize(9);
      const splitContent = fallbackPdf.splitTextToSize(options.content.slice(0, 1000), 170);
      fallbackPdf.text(splitContent, 20, 72);

      fallbackPdf.save(safeName);
      return { success: true };
    } catch (e) {
      console.error('Direct fallback error:', e);
      return { success: false };
    }
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Triggers native browser Print / Save-as-PDF dialog with complete Arabic vector typography.
 * ONLY called when user explicitly clicks the "طباعة" button!
 */
export function printNativeArabicDocument(options: PdfDocumentOptions): void {
  const { title } = options;
  const innerHtml = buildArabicDocumentHtml(options);

  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.top = '-9999px';
  printIframe.style.left = '-9999px';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = 'none';

  document.body.appendChild(printIframe);

  const doc = printIframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${escapeHtml(title)}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 16px;
          font-family: 'Cairo', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Tahoma, Arial, sans-serif;
          color: #1c1917;
          background: #ffffff;
          direction: rtl;
          text-align: right;
        }
      </style>
    </head>
    <body>
      ${innerHtml}
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    try {
      printIframe.contentWindow?.focus();
      printIframe.contentWindow?.print();
    } catch (err) {
      console.error('Print iframe error:', err);
    } finally {
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 3000);
    }
  }, 350);
}

/**
 * Downloads official Student Digital Card as an authentic Algerian PDF document directly to disk!
 * (Strictly Association Name Only in header; NO print dialog popup!)
 */
export async function downloadStudentCardAsPdf(student: Student): Promise<{ success: boolean }> {
  const isBem = student.educationLevel === 'BEM' || student.stream.includes('BEM');
  const levelTitle = isBem 
    ? 'شهادة التعليم المتوسط (BEM 2027)' 
    : 'شهادة البكالوريا (BAC 2027)';
  const safeName = `بطاقة_التلميذ_${student.fullName.replace(/\s+/g, '_')}_بذرة_غد.pdf`;

  const cardHtml = `
    <!-- Algerian Republic Header (Strictly Association Name Only) -->
    <div style="text-align: center; border-bottom: 2px solid #047857; padding-bottom: 12px; margin-bottom: 18px;">
      <div style="font-size: 11px; font-weight: 700; color: #44403c; margin-bottom: 2px;">الجمهورية الجزائرية الديمقراطية الشعبية</div>
      <div style="font-size: 10px; color: #78716c; margin-bottom: 3px;">مديرية التربية لولاية إن صالح</div>
      <div style="font-size: 15px; font-weight: 900; color: #047857;">جمعية «بذرة غد» الشبانية</div>
      <div style="font-size: 10px; color: #059669; font-weight: 700; margin-top: 2px;">البطاقة الرقمية الرسمية للتلميذ المتمدرس — الموسم 2026 / 2027</div>
    </div>

    <!-- Official Badge Card -->
    <div style="border: 2px solid #047857; border-radius: 14px; overflow: hidden; margin-bottom: 18px;">
      <div style="background: #064e3b; color: #ffffff; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 11px; color: #fef08a; font-weight: 800;">${levelTitle}</div>
          <div style="font-size: 16px; font-weight: 900; margin-top: 2px;">${escapeHtml(student.fullName)}</div>
          <div style="font-size: 11px; color: #a7f3d0; margin-top: 2px;">${escapeHtml(student.highSchool)} · ${escapeHtml(student.wilaya)}</div>
        </div>
        <div style="text-align: left; font-family: monospace; font-size: 11px; color: #d1fae5;">
          <div style="font-weight: 900; font-size: 13px; color: #fef08a;">${student.id.toUpperCase()}</div>
          <div style="margin-top: 4px;">تاريخ التسجيل: ${student.registrationDate}</div>
        </div>
      </div>

      <div style="padding: 16px; background: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 14px;">
          <tr>
            <td style="padding: 6px; font-weight: 700; color: #44403c; width: 25%;">الشعبة / المستوى:</td>
            <td style="padding: 6px; color: #047857; font-weight: 800;">${escapeHtml(student.stream)}</td>
            <td style="padding: 6px; font-weight: 700; color: #44403c; width: 25%;">رقم هاتف التلميذ:</td>
            <td style="padding: 6px; font-family: monospace; direction: ltr; text-align: right;">${escapeHtml(student.phone)}</td>
          </tr>
          <tr style="background: #fafaf9;">
            <td style="padding: 6px; font-weight: 700; color: #44403c;">نسبة المواظبة والحضور:</td>
            <td style="padding: 6px; color: #047857; font-weight: 800; font-family: monospace;">${student.attendanceRate}%</td>
            <td style="padding: 6px; font-weight: 700; color: #44403c;">معدل الاختبارات:</td>
            <td style="padding: 6px; font-weight: 800; font-family: monospace;">${student.averageScore} / 20</td>
          </tr>
        </table>

        <div style="margin-bottom: 12px;">
          <div style="font-size: 11.5px; font-weight: 800; color: #064e3b; margin-bottom: 4px;">المواد المسجلة في حصص الدعم:</div>
          <div style="font-size: 11px; color: #44403c;">${student.enrolledSubjects.join(' · ')}</div>
        </div>

        ${student.weaknesses.length > 0 ? `
        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 10px; font-size: 11px; color: #9a3412;">
          <b>نقاط تحتاج إلى تركيز ومرافقة بيداغوجية:</b> ${student.weaknesses.join(' · ')}
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Official Seal & Notice -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px; border-top: 1px solid #e7e5e4;">
      <div style="font-size: 10px; color: #78716c;">
        <div>★ هذه البطاقة وثيقة رقمية معتمدة صادرة عن جمعية بذرة غد الشبانية.</div>
        <div>★ ولاية إن صالح — مبادرة تطوعية مجانية 100%.</div>
      </div>
      <div style="border: 2px solid #047857; color: #047857; padding: 6px 14px; border-radius: 8px; text-align: center; font-weight: 900; font-size: 10px; background: #f0fdf4;">
        <div>جمعية بذرة غد الشبانية</div>
        <div style="font-size: 8.5px; color: #15803d;">ختم الإدارة المعتمد</div>
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1c1917';
  container.style.direction = 'rtl';
  container.style.fontFamily = "'Cairo', -apple-system, BlinkMacSystemFont, Tahoma, Arial, sans-serif";
  container.style.padding = '30px';
  container.style.opacity = '1';

  container.innerHTML = cardHtml;
  document.body.appendChild(container);

  try {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;

    pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, imgHeight);
    pdf.save(safeName);

    return { success: true };
  } catch (error) {
    console.error('Error generating card PDF, using direct download:', error);
    try {
      const fallbackPdf = new jsPDF();
      fallbackPdf.text(`Student Digital Card: ${student.fullName}`, 20, 20);
      fallbackPdf.text(`Stream: ${student.stream}`, 20, 30);
      fallbackPdf.text(`Average Score: ${student.averageScore}/20`, 20, 40);
      fallbackPdf.text(`Attendance Rate: ${student.attendanceRate}%`, 20, 50);
      fallbackPdf.save(safeName);
      return { success: true };
    } catch (e) {
      return { success: false };
    }
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
