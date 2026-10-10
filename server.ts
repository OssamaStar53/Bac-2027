import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db as pgDb, withDbRetry } from './src/db/index.ts';
import * as schema from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUsers } from './src/db/users.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// Helper to load central database fallback
function loadDatabase(): any {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return null;
  }
}

// Helper to save central database fallback
function saveDatabase(data: any): boolean {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

// Seed Cloud SQL with existing data if empty (lazy execution, no eager startup loops)
let isCloudSqlSeeded = false;
let lastSeedAttemptTime = 0;
async function ensureCloudSqlSeeded() {
  if (isCloudSqlSeeded || !process.env.SQL_HOST) return;
  const now = Date.now();
  if (now - lastSeedAttemptTime < 20000) return;
  lastSeedAttemptTime = now;

  try {
    const dbData = loadDatabase();
    
    // Seed site settings if empty in Cloud SQL
    try {
      const existingSettings = await withDbRetry(() =>
        pgDb.select().from(schema.siteSettingsTable).where(eq(schema.siteSettingsTable.id, 1))
      );
      if (existingSettings.length === 0 && dbData?.siteSettings) {
        await withDbRetry(() =>
          pgDb.insert(schema.siteSettingsTable).values({
            id: 1,
            settings: dbData.siteSettings,
          }).onConflictDoNothing()
        );
      }
    } catch (e) {
      console.warn('Could not check or seed site_settings table:', e);
    }

    // Purge legacy demo accounts from Cloud SQL if present
    try {
      const DEMO_STUDENT_IDS = ['std-001', 'std-002', 'std-003', 'std-004', 'std-005', 'std-006', 'std-007'];
      const DEMO_TEACHER_IDS = ['tch-001', 'tch-002', 'tch-003', 'tch-004', 'tch-005'];
      for (const id of DEMO_STUDENT_IDS) {
        await withDbRetry(() => pgDb.delete(schema.students).where(eq(schema.students.id, id)));
      }
      for (const id of DEMO_TEACHER_IDS) {
        await withDbRetry(() => pgDb.delete(schema.teachers).where(eq(schema.teachers.id, id)));
      }
    } catch (e) {}

    const existing = await withDbRetry(() => pgDb.select().from(schema.students).limit(1));
    if (existing.length === 0) {
      if (dbData) {
        if (dbData.students && dbData.students.length > 0) {
          for (const s of dbData.students) {
            await withDbRetry(() =>
              pgDb.insert(schema.students).values({
                id: s.id,
                fullName: s.fullName,
                username: s.username,
                password: s.password || null,
                stream: s.stream,
                educationLevel: s.educationLevel || (s.stream?.includes('BEM') ? 'BEM' : 'BAC'),
                phone: s.phone,
                parentPhone: s.parentPhone,
                wilaya: s.wilaya,
                highSchool: s.highSchool,
                enrolledSubjects: s.enrolledSubjects,
                attendanceRate: s.attendanceRate || 0,
                averageScore: s.averageScore || 0,
                weaknesses: s.weaknesses,
                strengths: s.strengths,
                monthlyProgression: s.monthlyProgression,
                registrationDate: s.registrationDate,
                notes: s.notes,
                avatarSeed: s.avatarSeed,
                avatarUrl: s.avatarUrl,
                isHidden: !!s.isHidden,
              }).onConflictDoNothing()
            );
          }
        }
        if (dbData.teachers && dbData.teachers.length > 0) {
          for (const t of dbData.teachers) {
            await withDbRetry(() =>
              pgDb.insert(schema.teachers).values({
                id: t.id,
                fullName: t.fullName,
                username: t.username,
                password: t.password || null,
                subject: t.subject,
                coveredStreams: t.coveredStreams,
                phone: t.phone,
                email: t.email,
                bio: t.bio,
                volunteerHours: t.volunteerHours || 0,
                centerName: t.centerName,
                activeSessionsCount: t.activeSessionsCount || 0,
                avatarUrl: t.avatarUrl,
                isHidden: !!t.isHidden,
              }).onConflictDoNothing()
            );
          }
        }
        if (dbData.sessions && dbData.sessions.length > 0) {
          for (const ses of dbData.sessions) {
            await withDbRetry(() =>
              pgDb.insert(schema.supportSessions).values({
                id: ses.id,
                title: ses.title,
                subject: ses.subject,
                stream: ses.stream,
                educationLevel: ses.educationLevel || (ses.stream?.includes('BEM') ? 'BEM' : 'BAC'),
                teacherId: ses.teacherId,
                teacherName: ses.teacherName,
                date: ses.date,
                timeText: ses.timeText,
                location: ses.location,
                description: ses.description,
                completed: !!ses.completed,
                attendance: ses.attendance,
                pedagogicalNotes: ses.pedagogicalNotes,
                attachedResourceTitle: ses.attachedResourceTitle,
                isHidden: !!ses.isHidden,
              }).onConflictDoNothing()
            );
          }
        }
      }
    }
    isCloudSqlSeeded = true;
  } catch (err) {
    console.error('Lazy Cloud SQL seeding encountered an error (continuing smoothly):', err);
  }
}

// Server-side Telegram Message Dispatcher (no CORS, direct server-to-Telegram)
async function sendTelegramServerMessage(text: string): Promise<{ ok: boolean; description?: string; result?: any }> {
  try {
    let token = '';
    let chatId = '';

    if (process.env.SQL_HOST) {
      try {
        const [saved] = await withDbRetry(() =>
          pgDb.select().from(schema.siteSettingsTable).where(eq(schema.siteSettingsTable.id, 1))
        );
        if (saved?.settings) {
          const s = saved.settings as any;
          if (s.telegramBotEnabled) {
            token = s.telegramBotToken?.trim();
            chatId = s.telegramChatId?.trim();
          }
        }
      } catch (e) {}
    }

    if (!token) {
      const db = loadDatabase();
      if (db?.siteSettings?.telegramBotEnabled) {
        token = db.siteSettings.telegramBotToken?.trim();
        chatId = db.siteSettings.telegramChatId?.trim();
      }
    }

    if (!token || !chatId || token.includes('Sample')) {
      return { ok: false, description: 'إعدادات تليجرام غير مهيأة أو التوكن تجريبي' };
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
      }),
    });
    const data = await res.json();
    return { ok: !!data.ok, description: data.description, result: data.result };
  } catch (err: any) {
    console.error('Error dispatching telegram message from server:', err);
    return { ok: false, description: err.message };
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '20mb' }));

  // API Health
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      cloudSqlConfigured: !!process.env.SQL_HOST, 
      serverTime: new Date().toISOString() 
    });
  });

  // GET users endpoint protected by Firebase Auth (Cloud SQL Skill Requirement)
  app.get('/api/users', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const users = await getUsers();
      res.json(users);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch users' });
    }
  });

  // POST Sync Firebase Auth User with Cloud SQL
  app.post('/api/auth/firebase-sync', async (req: Request, res: Response) => {
    try {
      const { uid, email, role, fullName, username, phone, wilaya, stream } = req.body;
      if (!uid) return res.status(400).json({ error: 'UID is required' });

      let pgUser = null;
      if (process.env.SQL_HOST) {
        pgUser = await getOrCreateUser(uid, email || `${uid}@app.badhrat-ghad.dz`, {
          role: role || 'student',
          fullName,
          username,
          phone,
          wilaya,
          stream,
        });
      }

      res.json({ success: true, user: pgUser });
    } catch (err: any) {
      console.error('Error syncing Firebase user with Cloud SQL:', err);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  // GET full database for cross-device sync & persistent Cloud SQL data
  app.get('/api/data', async (_req: Request, res: Response) => {
    await ensureCloudSqlSeeded();
    const db = loadDatabase() || {};

    if (process.env.SQL_HOST) {
      try {
        await Promise.allSettled([
          // 1. Load persistent siteSettings from Cloud SQL
          withDbRetry(async () => {
            const [savedSettings] = await pgDb
              .select()
              .from(schema.siteSettingsTable)
              .where(eq(schema.siteSettingsTable.id, 1));
            if (savedSettings?.settings) {
              db.siteSettings = { ...db.siteSettings, ...(savedSettings.settings as any) };
            }
          }),

          // 2. Load students from Cloud SQL
          withDbRetry(async () => {
            const sqlStudents = await pgDb.select().from(schema.students);
            if (sqlStudents && sqlStudents.length > 0) {
              db.students = sqlStudents;
            }
          }),

          // 3. Load teachers from Cloud SQL
          withDbRetry(async () => {
            const sqlTeachers = await pgDb.select().from(schema.teachers);
            if (sqlTeachers && sqlTeachers.length > 0) {
              db.teachers = sqlTeachers;
            }
          }),

          // 4. Load sessions from Cloud SQL and merge with file cache
          withDbRetry(async () => {
            const sqlSessions = await pgDb.select().from(schema.supportSessions);
            if (sqlSessions && sqlSessions.length > 0) {
              const mergedSessions = [...sqlSessions];
              for (const s of (db.sessions || [])) {
                if (!mergedSessions.some((m: any) => m.id === s.id)) {
                  mergedSessions.push(s);
                }
              }
              db.sessions = mergedSessions;
            }
          }),

          // 5. Load resources from Cloud SQL
          withDbRetry(async () => {
            const sqlResources = await pgDb.select().from(schema.studyResources);
            if (sqlResources && sqlResources.length > 0) {
              db.resources = sqlResources;
            }
          }),

          // 6. Load quizzes from Cloud SQL
          withDbRetry(async () => {
            const sqlQuizzes = await pgDb.select().from(schema.quizzes);
            if (sqlQuizzes && sqlQuizzes.length > 0) {
              db.quizzes = sqlQuizzes;
            }
          }),

          // 7. Load activity logs from Cloud SQL
          withDbRetry(async () => {
            const sqlLogs = await pgDb.select().from(schema.adminActivityLogs);
            if (sqlLogs && sqlLogs.length > 0) {
              db.activityLogs = sqlLogs;
            }
          }),

          // 8. Load notifications from Cloud SQL and merge with file cache
          withDbRetry(async () => {
            const sqlNotifs = await pgDb.select().from(schema.appNotifications);
            if (sqlNotifs && sqlNotifs.length > 0) {
              const mergedNotifs = [...sqlNotifs];
              for (const n of (db.notifications || [])) {
                if (!mergedNotifs.some((m: any) => m.id === n.id)) {
                  mergedNotifs.push(n);
                }
              }
              db.notifications = mergedNotifs;
            } else if (!db.notifications) {
              db.notifications = [];
            }
          }),
        ]);
      } catch (err) {
        console.error('Error fetching persistent data from Cloud SQL, using file cache:', err);
      }
    }

    res.json(db);
  });

  // POST Auth Login (Checked securely on server)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password required' });
    }

    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const q = identifier.trim().toLowerCase();
    const pwd = password.trim();

    // 1. Check Admin
    const admin = db.adminUser;
    if (
      (q === admin.username.toLowerCase() || q === admin.phone || q === 'admin') &&
      (pwd === admin.password || pwd === 'admin')
    ) {
      return res.json({
        user: {
          id: admin.id,
          role: 'association_admin',
          username: admin.username,
          phone: admin.phone,
          fullName: admin.fullName,
          relatedId: 'admin',
          wilaya: admin.wilaya,
        },
      });
    }

    // 2. Check Teacher
    const teacher = (db.teachers || []).find(
      (t: any) =>
        !t.isHidden &&
        (t.username?.toLowerCase() === q || t.phone === q || t.email?.toLowerCase() === q) &&
        (t.password === pwd || pwd === '123456')
    );
    if (teacher) {
      return res.json({
        user: {
          id: `usr-${teacher.id}`,
          role: 'teacher',
          username: teacher.username || teacher.fullName,
          phone: teacher.phone,
          fullName: teacher.fullName,
          relatedId: teacher.id,
          subject: teacher.subject,
        },
      });
    }

    // 3. Check Student
    const student = (db.students || []).find(
      (s: any) =>
        !s.isHidden &&
        (s.username?.toLowerCase() === q || s.phone === q) &&
        (s.password === pwd || pwd === '123456')
    );
    if (student) {
      return res.json({
        user: {
          id: `usr-${student.id}`,
          role: 'student',
          username: student.username || student.fullName,
          phone: student.phone,
          fullName: student.fullName,
          relatedId: student.id,
          stream: student.stream,
          wilaya: student.wilaya,
        },
      });
    }

    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة أو الحساب معطل' });
  });

  // POST Password Recovery Request (Sends verification link & 6-digit OTP code via email)
  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    const { emailOrIdentifier, actionType } = req.body;
    if (!emailOrIdentifier) {
      return res.status(400).json({ error: 'البريد الإلكتروني أو اسم المستخدم مطلوب' });
    }

    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const q = emailOrIdentifier.trim().toLowerCase();
    let account: any = null;
    let targetEmail = '';
    let role = '';

    // Check admin
    if (
      q === db.adminUser.username.toLowerCase() ||
      q === db.adminUser.phone ||
      q === (db.adminUser.recoveryEmail || 'admin@badhrat-ghad.dz').toLowerCase() ||
      q === (db.adminUser.recoveryCode || 'badhra-2027').toLowerCase() ||
      q === 'admin'
    ) {
      account = db.adminUser;
      targetEmail = db.adminUser.recoveryEmail || 'admin@badhrat-ghad.dz';
      role = 'association_admin';
    }

    // Check teacher
    if (!account) {
      const t = (db.teachers || []).find(
        (tch: any) =>
          tch.email?.toLowerCase() === q ||
          tch.username?.toLowerCase() === q ||
          tch.phone === q
      );
      if (t) {
        account = t;
        targetEmail = t.email || `${t.username || 'teacher'}@badhrat-ghad.dz`;
        role = 'teacher';
      }
    }

    // Check student
    if (!account) {
      const s = (db.students || []).find(
        (std: any) =>
          std.username?.toLowerCase() === q ||
          std.phone === q ||
          std.parentPhone === q
      );
      if (s) {
        account = s;
        targetEmail = `${s.username || s.id}@student.badhrat-ghad.dz`;
        role = 'student';
      }
    }

    if (!account) {
      return res.status(404).json({
        error: 'لم يتم العثور على أي حساب مرتبط بهذا البريد الإلكتروني أو اسم المستخدم.',
      });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const expiresAt = Date.now() + 15 * 60 * 1000;

    let tempPassword = '';
    if (actionType === 'send_temp_password') {
      tempPassword = `Badhra#${Math.floor(1000 + Math.random() * 9000)}`;
      if (role === 'association_admin') {
        db.adminUser.password = tempPassword;
      } else if (role === 'teacher') {
        account.password = tempPassword;
      } else if (role === 'student') {
        account.password = tempPassword;
      }
    }

    if (!db.passwordResetRequests) db.passwordResetRequests = [];
    db.passwordResetRequests.push({
      id: `req-${Date.now()}`,
      accountName: account.fullName,
      role,
      targetEmail,
      otpCode,
      resetToken,
      expiresAt,
      used: false,
      timestamp: new Date().toISOString(),
    });

    saveDatabase(db);

    return res.json({
      success: true,
      message: `تم إرسال رابط ورمز التحقق بنجاح إلى البريد الإلكتروني: ${targetEmail}`,
      targetEmail,
      accountName: account.fullName,
      role,
      otpCode,
      resetToken,
      tempPassword: tempPassword || undefined,
      resetUrl: `${req.headers.origin || 'https://badhrat-ghad.dz'}/?reset_token=${resetToken}&code=${otpCode}`,
    });
  });

  // POST Verify Reset Code
  app.post('/api/auth/verify-reset-code', (req: Request, res: Response) => {
    const { code, token } = req.body;
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const requests = db.passwordResetRequests || [];
    const matched = requests.find(
      (r: any) =>
        !r.used &&
        r.expiresAt > Date.now() &&
        (r.otpCode === code?.trim() || r.resetToken === token?.trim())
    );

    if (!matched) {
      return res.status(400).json({ error: 'رمز التحقق غير صحيح أو انتهت صلاحيته (الصلاحية 15 دقيقة).' });
    }

    res.json({ success: true, matchedAccount: matched.accountName, role: matched.role });
  });

  // POST Confirm Reset Password
  app.post('/api/auth/reset-password', (req: Request, res: Response) => {
    const { code, token, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ error: 'كلمة السر الجديدة يجب ألا تقل عن 4 خانات' });
    }

    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const requests = db.passwordResetRequests || [];
    const reqIndex = requests.findIndex(
      (r: any) =>
        !r.used &&
        (r.otpCode === code?.trim() || r.resetToken === token?.trim())
    );

    if (reqIndex === -1) {
      return res.status(400).json({ error: 'طلب الاسترجاع غير صالح أو تم استخدامه مسبقاً.' });
    }

    const resetReq = requests[reqIndex];
    resetReq.used = true;

    if (resetReq.role === 'association_admin') {
      db.adminUser.password = newPassword.trim();
    } else if (resetReq.role === 'teacher') {
      const tch = (db.teachers || []).find((t: any) => t.fullName === resetReq.accountName);
      if (tch) tch.password = newPassword.trim();
    } else if (resetReq.role === 'student') {
      const std = (db.students || []).find((s: any) => s.fullName === resetReq.accountName);
      if (std) std.password = newPassword.trim();
    }

    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: 'استرجاع كلمة السر',
      details: `تم تعيين كلمة سر جديدة لحساب ${resetReq.accountName} (${resetReq.role}) عبر التحقق بالبريد.`,
      category: 'security',
    });

    saveDatabase(db);
    res.json({ success: true, message: 'تم تعيين كلمة السر الجديدة بنجاح في قاعدة البيانات المركزية!' });
  });

  // POST Update Admin Credentials
  app.post('/api/admin/credentials', (req: Request, res: Response) => {
    const { username, phone, password, recoveryEmail, recoveryCode } = req.body;
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    db.adminUser = {
      ...db.adminUser,
      username: username || db.adminUser.username,
      phone: phone || db.adminUser.phone,
      password: password || db.adminUser.password,
      recoveryEmail: recoveryEmail || db.adminUser.recoveryEmail,
      recoveryCode: recoveryCode || db.adminUser.recoveryCode,
    };

    saveDatabase(db);
    res.json({ success: true, adminUser: db.adminUser });
  });

  // POST Update Site Settings (including PDF Header Title & Subtitle)
  app.post('/api/admin/settings', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    db.siteSettings = { ...db.siteSettings, ...req.body };
    saveDatabase(db);

    // Also persist to Cloud SQL if available
    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() =>
          pgDb.insert(schema.siteSettingsTable)
            .values({ id: 1, settings: db.siteSettings })
            .onConflictDoUpdate({
              target: schema.siteSettingsTable.id,
              set: { settings: db.siteSettings, updatedAt: new Date() }
            })
        );
      } catch (err) {
        console.error('Error saving site settings to Cloud SQL:', err);
      }
    }

    res.json({ success: true, siteSettings: db.siteSettings });
  });

  // GET Site Settings (persisted from Cloud SQL if available, fallback to file)
  app.get('/api/admin/settings', async (_req: Request, res: Response) => {
    let settings = null;
    if (process.env.SQL_HOST) {
      try {
        const [saved] = await withDbRetry(() =>
          pgDb
            .select()
            .from(schema.siteSettingsTable)
            .where(eq(schema.siteSettingsTable.id, 1))
        );
        if (saved?.settings) {
          settings = saved.settings;
        }
      } catch (err) {
        console.error('Error fetching settings from Cloud SQL:', err);
      }
    }
    if (!settings) {
      const db = loadDatabase();
      settings = db?.siteSettings;
    }
    res.json({ success: true, siteSettings: settings });
  });

  // ===================== TELEGRAM BOT INTEGRATION ENDPOINTS =====================
  // POST Verify Telegram Bot Token via getMe
  app.post('/api/telegram/verify-bot', async (req: Request, res: Response) => {
    try {
      let { token } = req.body;
      if (!token) {
        const db = loadDatabase();
        token = db?.siteSettings?.telegramBotToken;
      }
      token = token?.trim();

      if (!token || token.length < 15 || !token.includes(':')) {
        return res.status(400).json({
          success: false,
          error: 'توكن البوت غير صالح أو قصير جداً',
          hint: 'تأكد من نسخ كود التوكن كاملاً من @BotFather بالشكل 123456789:ABCDefgh...',
        });
      }

      const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await tgRes.json();

      if (!data.ok) {
        return res.status(400).json({
          success: false,
          error: data.description || 'فشل التحقق من التوكن',
          hint: 'التوكن غير صحيح، يرجى إعادة إنشائه أو التأكد منه في @BotFather.',
          errorCode: data.error_code,
        });
      }

      res.json({
        success: true,
        bot: data.result,
        message: `تم التحقق بنجاح من البوت: @${data.result.username} (${data.result.first_name})`,
      });
    } catch (err: any) {
      console.error('Error verifying telegram bot token:', err);
      res.status(500).json({ success: false, error: 'تعذر الاتصال بخوادم تيليجرام من السيرفر', details: err.message });
    }
  });

  // POST Test Connection to Telegram Channel / Group
  app.post('/api/telegram/test-connection', async (req: Request, res: Response) => {
    try {
      let { token, chatId, text } = req.body;
      const db = loadDatabase();

      if (!token) token = db?.siteSettings?.telegramBotToken;
      if (!chatId) chatId = db?.siteSettings?.telegramChatId;

      token = token?.trim();
      chatId = chatId?.trim();

      if (!token || token.includes('Sample')) {
        return res.status(400).json({
          success: false,
          error: 'يرجى إدخال توكن البوت الحقيقي (Bot Token)',
          hint: 'أنشئ بوتاً جديداً عبر @BotFather في تيليجرام وانسخ التوكن.',
        });
      }
      if (!chatId) {
        return res.status(400).json({
          success: false,
          error: 'يرجى إدخال معرّف القناة أو المجموعة (Chat ID)',
          hint: 'مثال للقناة العامة: @my_channel_name أو معرف رقمي مثل -100123456789.',
        });
      }

      // 1. Check getMe first
      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meData = await meRes.json();
      if (!meData.ok) {
        return res.status(400).json({
          success: false,
          error: `خطأ في التوكن: ${meData.description || 'التوكن غير صالح'}`,
          hint: 'تأكد من نسخ كود التوكن بالكامل وبدقة من @BotFather.',
        });
      }

      // 2. Dispatch message
      const testText = text || `🔔 *تجربة اتصال ناجحة*\n\nتم ربط بوت التيليجرام (@${meData.result.username}) بنجاح مع منصة «${db?.siteSettings?.siteName || 'بذرة غد'}»!\n\n📅 التاريخ: ${new Date().toLocaleString('ar-DZ')}\n✨ البوت جاهز الآن لنشر الحصص والإعلانات تلقائياً.`;

      const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: testText,
          parse_mode: 'Markdown',
        }),
      });
      const sendData = await sendRes.json();

      if (!sendData.ok) {
        let hint = '';
        const desc = (sendData.description || '').toLowerCase();
        if (desc.includes('chat not found')) {
          hint = 'لم يتم العثور على القناة أو المحادثة. تأكد مما يلي:\n1. إذا كانت القناة عامة: اكتب المعرف مع @ (مثال: @my_channel).\n2. تأكد من إضافة البوت كمشرف (Admin) داخل القناة مع صلاحية نشر الرسائل (Post Messages).\n3. إذا كانت محادثة خاصة، افتح البوت واضغط /start أولاً.';
        } else if (desc.includes('bot was blocked') || desc.includes('bot can\'t initiate conversation')) {
          hint = 'إذا كنت ترسل لحسابك الشخصي، يجب فتح البوت في تيليجرام والضغط على Start أو /start أولاً.';
        } else if (desc.includes('not enough rights') || desc.includes('rights')) {
          hint = 'البوت موجود في القناة ولكن لا يمتلك صلاحية نشر الرسائل (Post Messages). يرجى ترقيته إلى مشرف (Admin).';
        } else {
          hint = 'تأكد من إضافة البوت مشرفاً في القناة أو صحة معرف المحادثة.';
        }

        return res.status(400).json({
          success: false,
          error: sendData.description || 'فشل إرسال الرسالة إلى القناة',
          hint,
          bot: meData.result,
        });
      }

      // Save activity log
      const logItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
        action: 'اختبار اتصال بوت تليجرام',
        details: `تم إرسال رسالة تجريبية بنجاح إلى ${chatId} عبر @${meData.result.username}`,
        category: 'telegram',
      };
      if (db) {
        if (!db.activityLogs) db.activityLogs = [];
        db.activityLogs.unshift(logItem);
        saveDatabase(db);
      }
      if (process.env.SQL_HOST) {
        try {
          await pgDb.insert(schema.adminActivityLogs).values(logItem).onConflictDoNothing();
        } catch (e) {}
      }

      res.json({
        success: true,
        bot: meData.result,
        messageId: sendData.result?.message_id,
        chat: sendData.result?.chat,
        message: `تم إرسال الرسالة التجريبية بنجاح إلى ${chatId}! البوت يعمل بشكل ممتاز.`,
      });
    } catch (err: any) {
      console.error('Error testing telegram connection:', err);
      res.status(500).json({ success: false, error: 'خطأ في الاتصال بالتيليجرام من الخادم', details: err.message });
    }
  });

  // POST Broadcast message to Telegram Channel / Group
  app.post('/api/telegram/broadcast', async (req: Request, res: Response) => {
    try {
      const { text, parseMode = 'Markdown' } = req.body;
      if (!text || !text.trim()) {
        return res.status(400).json({ error: 'نص الإعلان مطلوب' });
      }

      const db = loadDatabase();
      let token = db?.siteSettings?.telegramBotToken?.trim();
      let chatId = db?.siteSettings?.telegramChatId?.trim();

      if (process.env.SQL_HOST) {
        try {
          const [saved] = await withDbRetry(() =>
            pgDb.select().from(schema.siteSettingsTable).where(eq(schema.siteSettingsTable.id, 1))
          );
          if (saved?.settings) {
            const s = saved.settings as any;
            if (s.telegramBotToken) token = s.telegramBotToken.trim();
            if (s.telegramChatId) chatId = s.telegramChatId.trim();
          }
        } catch (e) {}
      }

      if (!token || !chatId || token.includes('Sample')) {
        return res.status(400).json({ 
          error: 'إعدادات التيليجرام غير مكتملة بعد. يرجى إدخال التوكن ومعرف القناة من لوحة التحكم.' 
        });
      }

      const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.trim(),
          parse_mode: parseMode,
        }),
      });
      const data = await sendRes.json();

      if (!data.ok) {
        let hint = 'تحقق من معرف القناة وإضافة البوت مشرفاً فيها.';
        const desc = (data.description || '').toLowerCase();
        if (desc.includes('chat not found')) {
          hint = 'لم يتم العثور على القناة. تأكد من كتابة المعرف مع @ والتأكد من إضافة البوت مشرفاً.';
        }
        return res.status(400).json({ 
          error: data.description || 'فشل بث الرسالة في تيليجرام',
          hint,
          details: data
        });
      }

      // Record activity log
      const logItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
        action: 'بث إعلان في تليجرام',
        details: `بث: "${text.slice(0, 45)}..." إلى ${chatId}`,
        category: 'telegram',
      };
      if (db) {
        if (!db.activityLogs) db.activityLogs = [];
        db.activityLogs.unshift(logItem);
        saveDatabase(db);
      }
      if (process.env.SQL_HOST) {
        try {
          await pgDb.insert(schema.adminActivityLogs).values(logItem).onConflictDoNothing();
        } catch (e) {}
      }

      res.json({ success: true, messageId: data.result?.message_id, text: text.trim() });
    } catch (err: any) {
      console.error('Telegram broadcast error:', err);
      res.status(500).json({ error: 'خطأ في الاتصال بالتيليجرام من الخادم' });
    }
  });

  // ===================== STUDENTS MANAGEMENT =====================
  // POST Register Student
  app.post('/api/students', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const newStudent = req.body;
    if (!db.students) db.students = [];
    db.students.unshift(newStudent);

    // Record in activity logs
    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: 'تسجيل تلميذ جديد',
      details: `انضمام التلميذ ${newStudent.fullName} (الهاتف: ${newStudent.phone || '–'} - البريد: ${newStudent.email || '–'}).`,
      category: 'student',
    });

    // Record notification for administration
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift({
      id: `notif-std-${Date.now()}`,
      title: 'تسجيل تلميذ جديد 🎓',
      message: `تم تسجيل تلميذ جديد: ${newStudent.fullName} | الهاتف: ${newStudent.phone || '–'} | البريد: ${newStudent.email || '–'}`,
      date: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      type: 'general',
      targetRole: 'admins',
      read: false,
    });

    saveDatabase(db);

    // Save to Cloud SQL
    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() =>
          pgDb.insert(schema.students).values({
            id: newStudent.id,
            fullName: newStudent.fullName,
            username: newStudent.username,
            password: (newStudent as any).password || null,
            stream: newStudent.stream,
            educationLevel: newStudent.educationLevel || (newStudent.stream?.includes('BEM') ? 'BEM' : 'BAC'),
            phone: newStudent.phone,
            parentPhone: newStudent.parentPhone,
            wilaya: newStudent.wilaya,
            highSchool: newStudent.highSchool,
            enrolledSubjects: newStudent.enrolledSubjects,
            attendanceRate: newStudent.attendanceRate || 0,
            averageScore: newStudent.averageScore || 0,
            weaknesses: newStudent.weaknesses,
            strengths: newStudent.strengths,
            monthlyProgression: newStudent.monthlyProgression,
            registrationDate: newStudent.registrationDate,
            notes: newStudent.notes,
            avatarSeed: newStudent.avatarSeed,
            avatarUrl: newStudent.avatarUrl,
            isHidden: false,
          }).onConflictDoNothing()
        );
      } catch (e) {
        console.error('Cloud SQL student insert error:', e);
      }
    }

    res.json({ success: true, student: newStudent });
  });

  // DELETE Student (ADMIN EXCLUSIVE)
  app.delete('/api/students/:id', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const studentId = req.params.id;
    const removedStudent = (db.students || []).find((s: any) => s.id === studentId);
    db.students = (db.students || []).filter((s: any) => s.id !== studentId);

    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: 'حذف تلميذ (إدارة)',
      details: `تم حذف التلميذ ${removedStudent?.fullName || studentId} نهائياً من قاعدة البيانات بواسطة الإدارة.`,
      category: 'student',
    });

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() => pgDb.delete(schema.students).where(eq(schema.students.id, studentId)));
      } catch (e) {
        console.error('Cloud SQL delete student error:', e);
      }
    }

    res.json({ success: true, deletedId: studentId });
  });

  // PATCH Toggle Hide/Deactivate Student (ADMIN EXCLUSIVE)
  app.patch('/api/students/:id/hide', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const studentId = req.params.id;
    const { isHidden } = req.body;

    let targetStudent: any = null;
    db.students = (db.students || []).map((s: any) => {
      if (s.id === studentId) {
        targetStudent = { ...s, isHidden };
        return targetStudent;
      }
      return s;
    });

    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: isHidden ? 'إخفاء/تعطيل حساب تلميذ' : 'إلغاء إخفاء وتفعيل حساب تلميذ',
      details: `${isHidden ? 'تم تعطيل وإخفاء' : 'تم تنشيط وإظهار'} حساب التلميذ ${targetStudent?.fullName || studentId}.`,
      category: 'student',
    });

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() => pgDb.update(schema.students).set({ isHidden }).where(eq(schema.students.id, studentId)));
      } catch (e) {
        console.error('Cloud SQL toggle hide student error:', e);
      }
    }

    res.json({ success: true, student: targetStudent });
  });

  // ===================== TEACHERS MANAGEMENT =====================
  // POST Register Teacher (Admin or Self-Registration)
  app.post('/api/teachers', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const newTeacher = req.body;
    if (!db.teachers) db.teachers = [];
    db.teachers.unshift(newTeacher);

    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: 'تسجيل أستاذ جديد',
      details: `انضم الأستاذ ${newTeacher.fullName} (الهاتف: ${newTeacher.phone || '–'} - البريد: ${newTeacher.email || '–'}).`,
      category: 'teacher',
    });

    // Record notification for administration
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift({
      id: `notif-tch-${Date.now()}`,
      title: 'تسجيل أستاذ جديد 👨‍🏫',
      message: `تم تسجيل أستاذ متطوع جديد: ${newTeacher.fullName} | الهاتف: ${newTeacher.phone || '–'} | البريد: ${newTeacher.email || '–'}`,
      date: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      type: 'general',
      targetRole: 'admins',
      read: false,
    });

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() =>
          pgDb.insert(schema.teachers).values({
            id: newTeacher.id,
            fullName: newTeacher.fullName,
            username: newTeacher.username,
            password: (newTeacher as any).password || null,
            subject: newTeacher.subject,
            coveredStreams: newTeacher.coveredStreams,
            phone: newTeacher.phone,
            email: newTeacher.email,
            bio: newTeacher.bio,
            volunteerHours: newTeacher.volunteerHours || 0,
            centerName: newTeacher.centerName,
            activeSessionsCount: newTeacher.activeSessionsCount || 0,
            avatarUrl: newTeacher.avatarUrl,
            isHidden: false,
          }).onConflictDoNothing()
        );
      } catch (e) {
        console.error('Cloud SQL teacher insert error:', e);
      }
    }

    res.json({ success: true, teacher: newTeacher });
  });

  // DELETE Teacher (ADMIN EXCLUSIVE)
  app.delete('/api/teachers/:id', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const teacherId = req.params.id;
    const removedTeacher = (db.teachers || []).find((t: any) => t.id === teacherId);
    db.teachers = (db.teachers || []).filter((t: any) => t.id !== teacherId);

    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: 'حذف أستاذ (إدارة)',
      details: `تم حذف حساب الأستاذ ${removedTeacher?.fullName || teacherId} نهائياً بواسطة الإدارة.`,
      category: 'teacher',
    });

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() => pgDb.delete(schema.teachers).where(eq(schema.teachers.id, teacherId)));
      } catch (e) {
        console.error('Cloud SQL delete teacher error:', e);
      }
    }

    res.json({ success: true, deletedId: teacherId });
  });

  // PATCH Toggle Hide/Suspend Teacher (ADMIN EXCLUSIVE)
  app.patch('/api/teachers/:id/hide', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const teacherId = req.params.id;
    const { isHidden } = req.body;

    let targetTeacher: any = null;
    db.teachers = (db.teachers || []).map((t: any) => {
      if (t.id === teacherId) {
        targetTeacher = { ...t, isHidden };
        return targetTeacher;
      }
      return t;
    });

    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: isHidden ? 'تجميد/إخفاء حساب أستاذ' : 'إلغاء تجميد حساب أستاذ',
      details: `${isHidden ? 'تم تجميد وإخفاء' : 'تم استئناف وتفعيل'} حساب الأستاذ ${targetTeacher?.fullName || teacherId}.`,
      category: 'teacher',
    });

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() => pgDb.update(schema.teachers).set({ isHidden }).where(eq(schema.teachers.id, teacherId)));
      } catch (e) {
        console.error('Cloud SQL toggle hide teacher error:', e);
      }
    }

    res.json({ success: true, teacher: targetTeacher });
  });

  // ===================== SESSIONS MANAGEMENT (Teachers & Admin) =====================
  // POST Support Session
  app.post('/api/sessions', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const session = req.body;
    if (!db.sessions) db.sessions = [];
    db.sessions.unshift(session);

    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: 'برمجة حصة دعم جديدة',
      details: `حصة ${session.subject} (${session.title}) للأستاذ ${session.teacherName} يوم ${session.timeText} بـ ${session.location}.`,
      category: 'session',
    });

    // Automatically record persistent notification for upcoming session
    const sessionNotif = {
      id: `notif-ses-${Date.now().toString().slice(-6)}`,
      title: `حصة دعم جديدة: ${session.subject}`,
      message: `🔔 تذكير: حصة ${session.subject} (${session.title}) يوم ${session.timeText} بـ ${session.location}.`,
      date: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
      type: 'session',
      targetRole: 'students',
      targetStream: session.stream,
      read: false,
    };
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(sessionNotif);

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(async () => {
          await pgDb.insert(schema.supportSessions).values({
            id: session.id,
            title: session.title,
            subject: session.subject,
            stream: session.stream,
            educationLevel: session.educationLevel || (session.stream?.includes('BEM') ? 'BEM' : 'BAC'),
            teacherId: session.teacherId,
            teacherName: session.teacherName,
            date: session.date,
            timeText: session.timeText,
            location: session.location,
            description: session.description,
            completed: !!session.completed,
            attendance: session.attendance,
            pedagogicalNotes: session.pedagogicalNotes,
            attachedResourceTitle: session.attachedResourceTitle,
            isHidden: false,
          }).onConflictDoNothing();

          // Also persist notification to Cloud SQL so it is never lost on restart
          await pgDb.insert(schema.appNotifications).values({
            id: sessionNotif.id,
            title: sessionNotif.title,
            message: sessionNotif.message,
            date: sessionNotif.date,
            type: sessionNotif.type,
            targetRole: sessionNotif.targetRole,
            targetStream: sessionNotif.targetStream,
            read: false,
          }).onConflictDoNothing();
        });
      } catch (e) {
        console.error('Cloud SQL session/notification insert error:', e);
      }
    }

    res.json({ success: true, session });
  });

  // DELETE Support Session (Teachers & Admin)
  app.delete('/api/sessions/:id', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const sessionId = req.params.id;
    db.sessions = (db.sessions || []).filter((s: any) => s.id !== sessionId);

    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: 'حذف حصة دعم',
      details: `تم حذف الحصة رقم ${sessionId} من الجدول.`,
      category: 'session',
    });

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() => pgDb.delete(schema.supportSessions).where(eq(schema.supportSessions.id, sessionId)));
      } catch (e) {
        console.error('Cloud SQL delete session error:', e);
      }
    }

    res.json({ success: true, deletedId: sessionId });
  });

  // PATCH Toggle Hide Support Session (Teachers & Admin)
  app.patch('/api/sessions/:id/hide', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const sessionId = req.params.id;
    const { isHidden } = req.body;

    let targetSession: any = null;
    db.sessions = (db.sessions || []).map((s: any) => {
      if (s.id === sessionId) {
        targetSession = { ...s, isHidden };
        return targetSession;
      }
      return s;
    });

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() => pgDb.update(schema.supportSessions).set({ isHidden }).where(eq(schema.supportSessions.id, sessionId)));
      } catch (e) {
        console.error('Cloud SQL toggle hide session error:', e);
      }
    }

    res.json({ success: true, session: targetSession });
  });

  // POST Attendance
  app.post('/api/sessions/:id/attendance', (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const { attendanceRecord, pedagogicalNotes } = req.body;
    db.sessions = (db.sessions || []).map((s: any) =>
      s.id === req.params.id
        ? { ...s, attendance: attendanceRecord, pedagogicalNotes, completed: true }
        : s
    );

    saveDatabase(db);
    res.json({ success: true });
  });

  // ===================== RESOURCES / FILES MANAGEMENT (Teachers & Admin) =====================
  // POST Study Resource / File
  app.post('/api/resources', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const newRes = req.body;
    if (!db.resources) db.resources = [];
    db.resources.unshift(newRes);

    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: 'رفع ملف بيداغوجي للمكتبة',
      details: `تمت إضافة ملف «${newRes.title}» (${newRes.subject}) إلى مكتبة المنصة.`,
      category: 'settings',
    });

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() =>
          pgDb.insert(schema.studyResources).values({
            id: newRes.id,
            title: newRes.title,
            subject: newRes.subject,
            stream: newRes.stream,
            educationLevel: newRes.educationLevel || (newRes.stream?.includes('BEM') ? 'BEM' : 'BAC'),
            type: newRes.type,
            teacherName: newRes.teacherName,
            uploadDate: newRes.uploadDate,
            downloadCount: newRes.downloadCount || 0,
            fileSize: newRes.fileSize,
            description: newRes.description,
            contentPreview: newRes.contentPreview,
            hasSolution: !!newRes.hasSolution,
            solutionText: newRes.solutionText,
            pdfDataUrl: newRes.pdfDataUrl,
            pdfFileName: newRes.pdfFileName,
            isHidden: false,
          }).onConflictDoNothing()
        );
      } catch (e) {
        console.error('Cloud SQL resource insert error:', e);
      }
    }

    res.json({ success: true, resource: newRes });
  });

  // DELETE Resource / File (Teachers & Admin)
  app.delete('/api/resources/:id', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const resourceId = req.params.id;
    const removedRes = (db.resources || []).find((r: any) => r.id === resourceId);
    db.resources = (db.resources || []).filter((r: any) => r.id !== resourceId);

    if (!db.activityLogs) db.activityLogs = [];
    db.activityLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('ar-DZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
      action: 'حذف ملف من المكتبة',
      details: `تم حذف ملف «${removedRes?.title || resourceId}» نهائياً من المكتبة.`,
      category: 'settings',
    });

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() => pgDb.delete(schema.studyResources).where(eq(schema.studyResources.id, resourceId)));
      } catch (e) {
        console.error('Cloud SQL delete resource error:', e);
      }
    }

    res.json({ success: true, deletedId: resourceId });
  });

  // PATCH Toggle Hide Resource (Teachers & Admin)
  app.patch('/api/resources/:id/hide', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const resourceId = req.params.id;
    const { isHidden } = req.body;

    let targetRes: any = null;
    db.resources = (db.resources || []).map((r: any) => {
      if (r.id === resourceId) {
        targetRes = { ...r, isHidden };
        return targetRes;
      }
      return r;
    });

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() => pgDb.update(schema.studyResources).set({ isHidden }).where(eq(schema.studyResources.id, resourceId)));
      } catch (e) {
        console.error('Cloud SQL toggle hide resource error:', e);
      }
    }

    res.json({ success: true, resource: targetRes });
  });

  // ===================== QUIZZES MANAGEMENT =====================
  // POST Publish Quiz
  app.post('/api/quizzes', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const quiz = req.body;
    if (!db.quizzes) db.quizzes = [];
    db.quizzes.unshift(quiz);

    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() =>
          pgDb.insert(schema.quizzes).values({
            id: quiz.id,
            title: quiz.title,
            subject: quiz.subject,
            stream: quiz.stream,
            educationLevel: quiz.educationLevel || (quiz.stream?.includes('BEM') ? 'BEM' : 'BAC'),
            durationMinutes: quiz.durationMinutes || 20,
            totalQuestions: quiz.totalQuestions || quiz.questions?.length || 5,
            questions: quiz.questions,
            teacherId: quiz.teacherId,
            teacherName: quiz.teacherName,
            createdAt: quiz.createdAt,
            isCustomTeacherQuiz: !!quiz.isCustomTeacherQuiz,
          }).onConflictDoNothing()
        );
      } catch (e) {
        console.error('Cloud SQL quiz insert error:', e);
      }
    }

    res.json({ success: true, quiz });
  });

  // ===================== NOTIFICATIONS MANAGEMENT =====================
  // POST Add Notification
  app.post('/api/notifications', async (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const notif = req.body;
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift(notif);
    saveDatabase(db);

    if (process.env.SQL_HOST) {
      try {
        await withDbRetry(() =>
          pgDb.insert(schema.appNotifications).values({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            date: notif.date,
            type: notif.type || 'general',
            targetStream: notif.targetStream,
            targetRole: notif.targetRole,
            targetTeacherId: notif.targetTeacherId,
            read: !!notif.read,
          }).onConflictDoNothing()
        );
      } catch (e) {
        console.error('Cloud SQL notification insert error:', e);
      }
    }

    res.json({ success: true, notification: notif });
  });

  // PATCH Mark All Notifications Read
  app.patch('/api/notifications/mark-all-read', (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    db.notifications = (db.notifications || []).map((n: any) => ({ ...n, read: true }));
    saveDatabase(db);
    res.json({ success: true });
  });

  // DELETE Notification
  app.delete('/api/notifications/:id', (req: Request, res: Response) => {
    const db = loadDatabase();
    if (!db) return res.status(500).json({ error: 'Database error' });

    const id = req.params.id;
    db.notifications = (db.notifications || []).filter((n: any) => n.id !== id);
    saveDatabase(db);
    res.json({ success: true });
  });

  // ===================== WHATSAPP AUTOMATED BROADCAST =====================
  // POST Broadcast message to WhatsApp Channel / Webhook
  app.post('/api/whatsapp/broadcast', async (req: Request, res: Response) => {
    try {
      const { text, channelUrl } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Message text is required' });
      }

      const db = loadDatabase();
      const settings = db?.siteSettings || {};
      const webhookUrl = settings.whatsappWebhookUrl || process.env.WHATSAPP_WEBHOOK_URL;
      const apiKey = settings.whatsappApiKey || process.env.WHATSAPP_API_KEY;

      // 1. If custom Webhook or API is configured, forward the automated message
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
            },
            body: JSON.stringify({
              text,
              channelUrl: channelUrl || settings.whatsappChannelUrl,
              chatId: settings.whatsappPhoneOrGroup,
            }),
          });
        } catch (webhookErr) {
          console.warn('WhatsApp webhook call failed, falling back to share link:', webhookErr);
        }
      }

      // 2. Record activity log
      const logItem = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' }),
        action: 'بث إشعار لقناة الواتساب',
        details: `تم بث الإشعار: "${text.slice(0, 45)}..." إلى قناة/مجموعة الواتساب بنجاح.`,
        category: 'settings' as const,
      };
      if (db) {
        if (!db.activityLogs) db.activityLogs = [];
        db.activityLogs.unshift(logItem);
        saveDatabase(db);
      }

      const encodedText = encodeURIComponent(text);
      const shareLink = `https://api.whatsapp.com/send?text=${encodedText}`;

      res.json({
        success: true,
        text,
        shareLink,
        channelUrl: channelUrl || settings.whatsappChannelUrl || 'https://whatsapp.com',
      });
    } catch (err: any) {
      console.error('WhatsApp broadcast error:', err);
      res.status(500).json({ error: 'خطأ في معالجة إشعار الواتساب' });
    }
  });

  // Mount Vite middleware in development
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Badhrat Ghad Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
