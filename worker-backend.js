// --- START OF FILE worker-backend.js ---

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

const app = new Hono();

// تعريف الجداول يدوياً لكي يعمل Drizzle
const students = sqliteTable('students', {
    id: integer('id').primaryKey(),
    student_id: text('student_id').unique(),
    name: text('name'),
    grade: text('grade'),
    average: integer('average'),
    school_name: text('school_name'),
    region: text('region'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

const users = sqliteTable('users', {
    id: integer('id').primaryKey(),
    username: text('username').unique(),
    password: text('password'),
    role: text('role'),
    created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// إعدادات CORS
app.use('/*', cors({
  origin: '*', 
  allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// ------------------- نقاط نهاية (Endpoints) حقيقية -------------------

// نقطة نهاية لجلب الإحصائيات للوحة التحكم
app.get('/api/stats', async (c) => {
    const db = c.env.DB;
    try {
        const totalStudents = await db.prepare('SELECT COUNT(*) as count FROM students').first('count');
        const highestScore = await db.prepare('SELECT MAX(average) as max_avg FROM students').first('max_avg');
        const averageScore = await db.prepare('SELECT AVG(average) as avg_avg FROM students').first('avg_avg');
        const lowestScore = await db.prepare('SELECT MIN(average) as min_avg FROM students').first('min_avg');

        return c.json({
            total_students: totalStudents || 0,
            highest_score: highestScore || 0,
            average_score: Math.round(averageScore) || 0,
            lowest_score: lowestScore || 0,
        });
    } catch (e) {
        return c.json({ error: 'Failed to fetch stats', details: e.message }, 500);
    }
});

// جلب الطلاب للوحة التحكم (مع pagination)
app.get('/api/admin/students', async (c) => {
    const db = c.env.DB;
    const { limit = 5, offset = 0 } = c.req.query();
    try {
        const results = await db.prepare('SELECT * FROM students ORDER BY created_at DESC LIMIT ? OFFSET ?')
            .bind(parseInt(limit), parseInt(offset))
            .all();
        const total = await db.prepare('SELECT COUNT(*) as count FROM students').first('count');
        
        return c.json({
            students: results,
            total: total || 0
        });
    } catch (e) {
        return c.json({ error: 'Failed to fetch students', details: e.message }, 500);
    }
});


// البحث عن طالب (للموقع العام)
app.post('/api/search', async (c) => {
  const db = drizzle(c.env.DB);
  const { query } = await c.req.json();
  try {
    const results = await db.select().from(students)
      .where(sql`name LIKE ${'%' + query + '%'} OR student_id LIKE ${'%' + query + '%'}`)
      .all();
    return c.json(results);
  } catch (e) {
    return c.json({ error: 'Failed to search students', details: e.message }, 500);
  }
});


// رفع بيانات الطلاب (يستقبل JSON جاهز) - النسخة المحسنة
app.post('/api/students/upload', async (c) => {
  try {
    const studentsData = await c.req.json();

    if (!Array.isArray(studentsData) || studentsData.length === 0) {
      return c.json({ error: 'لم يتم إرسال بيانات طلاب' }, 400);
    }

    const db = c.env.DB;

    // إعداد دفعة واحدة من الأوامر لإرسالها لقاعدة البيانات
    const batchStatements = studentsData.map(student => {
      return db.prepare('INSERT OR REPLACE INTO students (student_id, name, grade, average, school_name, region) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(
          student.student_id, student.name, student.grade,
          parseFloat(student.average) || 0, student.school_name, student.region
        );
    });

    // تنفيذ كل الأوامر في عملية واحدة سريعة جداً
    await db.batch(batchStatements);
    
    return c.json({ success: true, message: `تم رفع بيانات ${studentsData.length} طالب بنجاح.` });

  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ error: 'حدث خطأ داخلي أثناء حفظ البيانات', details: error.message }, 500);
  }
});


// جلب قائمة المديرين
app.get('/api/managers', async (c) => {
    const db = drizzle(c.env.DB);
    try {
        const managers = await db.select({
            id: users.id, username: users.username, role: users.role, created_at: users.created_at
        }).from(users).all();
        return c.json(managers);
    } catch(e) {
        return c.json({ error: 'Failed to fetch managers', details: e.message }, 500);
    }
});

// إضافة مدير جديد
app.post('/api/managers', async (c) => {
    const db = drizzle(c.env.DB);
    // You'd add auth middleware here in a real app
    const { username, password, role } = await c.req.json();
    if (!username || !password || !role) return c.json({ error: 'Missing fields' }, 400);
    try {
        // We are not using bcrypt here for simplicity with Workers environment
        await db.insert(users).values({ username, password: password, role }).run();
        return c.json({ success: true, message: 'Manager added successfully' });
    } catch (e) {
        if (e.message.includes('UNIQUE')) return c.json({ error: 'اسم المستخدم هذا موجود بالفعل' }, 409);
        return c.json({ error: 'Failed to add manager', details: e.message }, 500);
    }
});


// نقاط نهاية وهمية للبيانات الثابتة
app.get('/api/content', (c) => c.json({ page_title: "نظام نتائج الطلاب الذكي" }));
app.get('/api/stages', (c) => c.json([ { id: 'primary', name: "المرحلة الابتدائية", regions: ["القاهرة"] } ]));

// تسجيل دخول الأدمن (بدون تشفير للتبسيط)
app.post('/api/admin/login', async (c) => {
  const { username, password } = await c.req.json();
  // In a real app, you would fetch the user from the DB and compare hashed passwords
  if (username === 'admin' && password === 'admin123') {
    return c.json({ success: true, access_token: "fake-token-for-testing" });
  }
  return c.json({ success: false, message: 'Invalid credentials' }, 401);
});

export default app;