import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as jose from 'jose';
import * as bcrypt from 'bcrypt-ts';
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
  origin: '*', // للسماح لجميع المصادر
  allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// ------------------- نقاط نهاية (Endpoints) حقيقية -------------------

// البحث عن طالب
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

    // --- START: هذا هو التعديل المهم ---
    // إعداد دفعة واحدة من الأوامر لإرسالها لقاعدة البيانات
    const batchStatements = studentsData.map(student => {
      return db.prepare('INSERT OR REPLACE INTO students (student_id, name, grade, average, school_name, region) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(
          student.student_id,
          student.name,
          student.grade,
          parseFloat(student.average) || 0,
          student.school_name,
          student.region
        );
    });

    // تنفيذ كل الأوامر في عملية واحدة سريعة جداً
    await db.batch(batchStatements);
    // --- END: انتهى التعديل ---
    
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
            id: users.id,
            username: users.username,
            role: users.role,
            created_at: users.created_at
        }).from(users).all();
        return c.json(managers);
    } catch(e) {
        return c.json({ error: 'Failed to fetch managers', details: e.message }, 500);
    }
});

// إضافة مدير جديد
app.post('/api/managers', async (c) => {
    const db = drizzle(c.env.DB);
    const { username, password, role } = await c.req.json();
    if (!username || !password || !role) return c.json({ error: 'Missing fields' }, 400);
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.insert(users).values({ username, password: hashedPassword, role }).run();
        return c.json({ success: true, message: 'Manager added successfully' });
    } catch (e) {
        if (e.message.includes('UNIQUE')) return c.json({ error: 'اسم المستخدم هذا موجود بالفعل' }, 409);
        return c.json({ error: 'Failed to add manager', details: e.message }, 500);
    }
});


// نقاط نهاية وهمية للبيانات الثابتة (للتوافق مع الواجهة الأمامية)
app.get('/api/content', (c) => c.json({ page_title: "نظام نتائج الطلاب الذكي", meta_description: "استعلم عن نتائج الطلاب بسهولة وسرعة.", /* ... باقي البيانات */ }));
app.get('/api/stages', (c) => c.json([ { id: 'primary', name: "المرحلة الابتدائية", regions: ["القاهرة", "الجيزة"] }, {id: 'middle', name: "المرحلة الإعدادية", regions: ["القاهرة", "الجيزة"]} ]));

// تسجيل دخول الأدمن
const JWT_SECRET = 'your-super-secret-key-change-it';
const secret = new TextEncoder().encode(JWT_SECRET);

app.post('/api/admin/login', async (c) => {
  const { username, password } = await c.req.json();
  // في مشروع حقيقي، يجب جلب المستخدم من قاعدة البيانات والتحقق من كلمة المرور المشفرة
  if (username === 'admin' && password === 'admin123') {
    const token = await new jose.SignJWT({ username: 'admin', role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(secret);
    return c.json({ success: true, access_token: token });
  }
  return c.json({ success: false, message: 'Invalid credentials' }, 401);
});

export default app;