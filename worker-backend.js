import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as jose from 'jose';
import * as bcrypt from 'bcrypt-ts';
import * as XLSX from 'xlsx/dist/xlsx.mini.min.js'; // <-- هذا هو التعديل الوحيد والمهم
import { drizzle } from 'drizzle-orm/d1';
import { sql, eq } from 'drizzle-orm';
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
  origin: '*', 
  allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// 1. البحث عن طالب
app.post('/api/search', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const { query } = body;

  try {
    let results;
    if (query) {
      results = await db.select().from(students)
        .where(sql`name LIKE ${'%' + query + '%'} OR student_id LIKE ${'%' + query + '%'}`)
        .all();
    } else {
      results = await db.select().from(students).all();
    }
    return c.json(results);
  } catch (e) {
    return c.json({ error: 'Failed to search students', details: e.message }, 500);
  }
});

// 2. رفع ملف الإكسيل
app.post('/api/students/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return c.json({ error: 'لم يتم العثور على ملف' }, 400);
    }
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const studentsData = XLSX.utils.sheet_to_json(worksheet);
    if (studentsData.length === 0) {
      return c.json({ error: 'ملف الإكسيل فارغ' }, 400);
    }
    const db = c.env.DB;
    const batchStatements = studentsData.map(student => {
      return db.prepare('INSERT INTO students (student_id, name, grade, average, school_name, region) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(student.student_id, student.name, student.grade, parseFloat(student.average) || 0, student.school_name, student.region);
    });
    await db.batch(batchStatements);
    return c.json({ success: true, message: `تم رفع بيانات ${studentsData.length} طالب بنجاح.` });
  } catch (error) {
    return c.json({ error: 'حدث خطأ داخلي أثناء معالجة ملف الإكسيل', details: error.message }, 500);
  }
});

// 3. جلب قائمة المديرين
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

// 4. إضافة مدير جديد
app.post('/api/managers', async (c) => {
    const db = drizzle(c.env.DB);
    const { username, password, role } = await c.req.json();

    if (!username || !password || !role) {
        return c.json({ error: 'Username, password, and role are required' }, 400);
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.insert(users).values({
            username,
            password: hashedPassword,
            role
        }).run();
        return c.json({ success: true, message: 'Manager added successfully' });
    } catch (e) {
        if (e.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'اسم المستخدم هذا موجود بالفعل' }, 409);
        }
        return c.json({ error: 'Failed to add manager', details: e.message }, 500);
    }
});

// المسارات القديمة
app.get('/api/content', (c) => {
  const siteContent = { page_title: "نظام نتائج الطلاب الذكي", meta_description: "استعلم عن نتائج الطلاب بسهولة وسرعة.", seo_keywords: "نتائج, طلاب, مدارس, استعلام", hero_title: "استعلم عن نتيجتك الآن", hero_subtitle: "ابحث بالاسم أو رقم الجلوس واحصل على نتيجتك فوراً.", about_section: "نظام متطور يوفر وصولاً سريعاً وموثوقاً لنتائج الطلاب.", features: [ { icon: "⚡️", title: "سرعة فائقة", description: "احصل على نتيجتك في ثوانٍ." }, { icon: "🔒", title: "آمن وموثوق", description: "بياناتك محمية ومؤمنة." }, { icon: "📱", title: "متوافق مع الجوال", description: "استخدم النظام من أي جهاز." }, { icon: "🔔", title: "إشعارات فورية", description: "اشترك لتصلك النتائج فور ظهورها." } ], contact_info: { phone: "+123456789", email: "info@example.com", address: "المدينة, الدولة" }, social_links: { twitter: "#", facebook: "#", instagram: "#" }, footer_text: "جميع الحقوق محفوظة © 2024" };
  return c.json(siteContent);
});

app.get('/api/stages', (c) => {
  const educationalStages = [ { id: 'primary', name: "المرحلة الابتدائية", description: "نتائج الصفوف من الأول إلى السادس الابتدائي.", icon: "🧸", color: "#3B82F6", regions: ["القاهرة", "الجيزة", "الإسكندرية"] }, { id: 'middle', name: "المرحلة الإعدادية", description: "نتائج الصفوف الأول والثاني والثالث الإعدادي.", icon: "📚", color: "#10B981", regions: ["القاهرة", "الجيزة", "الشرقية"] }, { id: 'secondary', name: "المرحلة الثانوية", description: "نتائج الصف الأول والثاني والثالث الثانوي.", icon: "🎓", color: "#8B5CF6", regions: ["كل المحافظات"] } ];
  return c.json(educationalStages);
});

const JWT_SECRET = 'your-super-secret-key-that-is-long-and-secure';
const secret = new TextEncoder().encode(JWT_SECRET);

app.post('/api/admin/login', async (c) => {
  const body = await c.req.json();
  const { username, password } = body;
  if (username === 'admin' && password === 'admin123') {
    const token = await new jose.SignJWT({ userId: 1, username: 'admin' }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('2h').sign(secret);
    return c.json({ success: true, access_token: token });
  }
  return c.json({ success: false, message: 'Invalid credentials' }, 401);
});

export default app;