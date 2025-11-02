import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as jose from 'jose';
import * as bcrypt from 'bcrypt-ts';
import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

const app = new Hono();

// ==================== Database Schema ====================
const students = sqliteTable('students', {
  id: integer('id').primaryKey(),
  studentid: text('studentid').unique(),
  name: text('name'),
  grade: text('grade'),
  average: integer('average'),
  schoolname: text('schoolname'),
  region: text('region'),
  educationalstageid: text('educationalstageid'),
  classname: text('classname'),
  administration: text('administration'),
  schoolcode: text('schoolcode'),
  section: text('section'),
  subjects: text('subjects'), // JSON string
  createdat: text('createdat').default(sql`CURRENT_TIMESTAMP`)
});

const users = sqliteTable('users', {
  id: integer('id').primaryKey(),
  username: text('username').unique(),
  password: text('password'),
  role: text('role'),
  createdat: text('createdat').default(sql`CURRENT_TIMESTAMP`)
});

const stages = sqliteTable('stages', {
  id: integer('id').primaryKey(),
  name: text('name'),
  nameen: text('nameen'),
  description: text('description'),
  icon: text('icon'),
  color: text('color'),
  regions: text('regions'), // JSON array
  displayorder: integer('displayorder'),
  isactive: integer('isactive').default(1)
});

const content = sqliteTable('content', {
  id: integer('id').primaryKey(),
  pagetitle: text('pagetitle'),
  metadescription: text('metadescription'),
  seokeywords: text('seokeywords'),
  herotitle: text('herotitle'),
  herosubtitle: text('herosubtitle'),
  aboutsection: text('aboutsection'),
  features: text('features'), // JSON
  footertext: text('footertext'),
  contactinfo: text('contactinfo'), // JSON
  sociallinks: text('sociallinks') // JSON
});

const faqs = sqliteTable('faqs', {
  id: integer('id').primaryKey(),
  question: text('question'),
  answer: text('answer'),
  category: text('category'),
  displayorder: integer('displayorder'),
  isactive: integer('isactive').default(1)
});

const guides = sqliteTable('guides', {
  id: integer('id').primaryKey(),
  title: text('title'),
  content: text('content'),
  icon: text('icon'),
  displayorder: integer('displayorder'),
  isactive: integer('isactive').default(1)
});

const news = sqliteTable('news', {
  id: integer('id').primaryKey(),
  title: text('title'),
  content: text('content'),
  publishdate: text('publishdate'),
  isactive: integer('isactive').default(1)
});

// ==================== CORS Configuration ====================
app.use('*', cors({
  origin: '*',
  allowMethods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// ==================== JWT Configuration ====================
const JWT_SECRET = 'your-super-secret-key-change-it-in-production';
const secret = new TextEncoder().encode(JWT_SECRET);

// ==================== Auth Middleware ====================
const authMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const token = authHeader.substring(7);
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    c.set('user', payload);
    await next();
  } catch (e) {
    return c.json({ error: 'Invalid token' }, 401);
  }
};

// ==================== Public Endpoints ====================

// Health Check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Student Results API is running',
    version: '3.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Search Students
app.post('/api/search', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const {
    query = '',
    searchtype = 'all',
    educationalstageid = null,
    regionfilter = null,
    searchfields = ['name', 'studentid']
  } = body;

  try {
    let whereClause = [];
    
    if (query && query.trim()) {
      if (searchtype === 'studentid' || searchfields.includes('studentid')) {
        whereClause.push(sql`studentid LIKE ${`%${query}%`}`);
      }
      if (searchtype === 'name' || searchtype === 'all' || searchfields.includes('name')) {
        whereClause.push(sql`name LIKE ${`%${query}%`}`);
      }
    }
    
    if (educationalstageid) {
      whereClause.push(sql`educationalstageid = ${educationalstageid}`);
    }
    
    if (regionfilter) {
      whereClause.push(sql`region = ${regionfilter}`);
    }
    
    const finalWhere = whereClause.length > 0 
      ? sql.join(whereClause, sql` OR `)
      : sql`1=1`;
      
    const results = await db.select()
      .from(students)
      .where(finalWhere)
      .limit(50)
      .all();

    const parsedResults = results.map(student => ({
      ...student,
      subjects: student.subjects ? JSON.parse(student.subjects) : []
    }));

    return c.json({
      results: parsedResults,
      students: parsedResults,
      count: parsedResults.length
    });
  } catch (e) {
    console.error('Search error:', e);
    return c.json({ error: 'Failed to search', details: e.message }, 500);
  }
});

// Get Stages
app.get('/api/stages', async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const results = await db.select()
      .from(stages)
      .where(sql`isactive = 1`)
      .orderBy(stages.displayorder)
      .all();

    const parsedResults = results.map(stage => ({
      ...stage,
      regions: stage.regions ? JSON.parse(stage.regions) : []
    }));

    return c.json(parsedResults);
  } catch (e) {
    return c.json([
      {
        id: '1',
        name: 'الثانوية العامة',
        nameen: 'General Secondary Certificate',
        description: 'نتائج الثانوية العامة',
        icon: '🎓',
        color: '#3b82f6',
        regions: ['القاهرة', 'الجيزة', 'الإسكندرية'],
        displayorder: 1,
        isactive: 1
      },
      {
        id: '2',
        name: 'الإعدادية',
        nameen: 'Preparatory Certificate',
        description: 'نتائج الشهادة الإعدادية',
        icon: '📚',
        color: '#10b981',
        regions: ['القاهرة', 'الجيزة'],
        displayorder: 2,
        isactive: 1
      }
    ]);
  }
});

// Get Content
app.get('/api/content', async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const result = await db.select().from(content).limit(1).get();
    
    if (result) {
      return c.json({
        ...result,
        features: result.features ? JSON.parse(result.features) : [],
        contactinfo: result.contactinfo ? JSON.parse(result.contactinfo) : {},
        sociallinks: result.sociallinks ? JSON.parse(result.sociallinks) : {}
      });
    }
  } catch (e) {
    console.error('Content fetch error:', e);
  }
  
  return c.json({
    pagetitle: 'نظام نتائج الطلاب',
    metadescription: 'استعلم عن نتائج الطلاب في جميع المراحل التعليمية',
    seokeywords: 'نتائج,طلاب,امتحانات,شهادات',
    herotitle: 'استعلم عن نتيجتك الآن',
    herosubtitle: 'نتائج جميع المراحل التعليمية',
    aboutsection: 'نظام متطور للاستعلام عن النتائج',
    features: [
      { title: 'بحث سريع', description: 'استعلام فوري', icon: '⚡' },
      { title: 'نتائج دقيقة', description: 'بيانات محدثة', icon: '✅' }
    ],
    footertext: '© 2025 جميع الحقوق محفوظة',
    contactinfo: {},
    sociallinks: {}
  });
});

// Get FAQs
app.get('/api/faqs', async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const results = await db.select()
      .from(faqs)
      .where(sql`isactive = 1`)
      .orderBy(faqs.displayorder)
      .all();
    
    return c.json(results);
  } catch (e) {
    return c.json([]);
  }
});

// Get Guides
app.get('/api/guides', async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const results = await db.select()
      .from(guides)
      .where(sql`isactive = 1`)
      .orderBy(guides.displayorder)
      .all();
    
    return c.json(results);
  } catch (e) {
    return c.json([]);
  }
});

// Get News
app.get('/api/news', async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const results = await db.select()
      .from(news)
      .where(sql`isactive = 1`)
      .orderBy(sql`publishdate DESC`)
      .limit(10)
      .all();
    
    return c.json(results);
  } catch (e) {
    return c.json([]);
  }
});

// Get Statistics
app.get('/api/stats', async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const totalStudents = await db.select({ count: sql`count(*)` })
      .from(students)
      .get();
      
    const highestScore = await db.select({ max: sql`max(average)` })
      .from(students)
      .get();
      
    const lowestScore = await db.select({ min: sql`min(average)` })
      .from(students)
      .get();
      
    const avgScore = await db.select({ avg: sql`avg(average)` })
      .from(students)
      .get();

    return c.json({
      totalstudents: totalStudents?.count || 0,
      highestscore: highestScore?.max || 0,
      lowestscore: lowestScore?.min || 0,
      averagescore: Math.round(avgScore?.avg || 0)
    });
  } catch (e) {
    return c.json({
      totalstudents: 0,
      highestscore: 0,
      lowestscore: 0,
      averagescore: 0
    });
  }
});

// ==================== Admin Authentication ====================
app.post('/api/admin/login', async (c) => {
  const db = drizzle(c.env.DB);
  const { username, password } = await c.req.json();
  
  try {
    const user = await db.select()
      .from(users)
      .where(sql`username = ${username}`)
      .limit(1)
      .get();
    
    if (user && bcrypt.compareSync(password, user.password)) {
      const token = await new jose.SignJWT({ 
        username: user.username, 
        role: user.role 
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(secret);

      return c.json({
        success: true,
        accesstoken: token,
        user: { username: user.username, role: user.role }
      });
    }
  } catch (e) {
    console.error('Login DB error:', e);
  }
  
  // Fallback للتطوير
  if (username === 'admin' && password === 'admin123') {
    const token = await new jose.SignJWT({ username: 'admin', role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(secret);

    return c.json({
      success: true,
      accesstoken: token,
      user: { username: 'admin', role: 'admin' }
    });
  }

  return c.json({ success: false, message: 'Invalid credentials' }, 401);
});

// ==================== Admin Protected Endpoints ====================

// Get All Students (Admin)
app.get('/api/admin/students', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const { skip = '0', limit = '100' } = c.req.query();
  
  try {
    const results = await db.select()
      .from(students)
      .limit(parseInt(limit))
      .offset(parseInt(skip))
      .all();

    const total = await db.select({ count: sql`count(*)` })
      .from(students)
      .get();

    const parsedResults = results.map(student => ({
      ...student,
      subjects: student.subjects ? JSON.parse(student.subjects) : []
    }));

    return c.json({
      students: parsedResults,
      total: total?.count || 0
    });
  } catch (e) {
    return c.json({ error: 'Failed to fetch students', details: e.message }, 500);
  }
});

// Add Student (Admin)
app.post('/api/admin/students', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const data = await c.req.json();
  
  try {
    const subjectsJson = JSON.stringify(data.subjects || []);
    
    await db.run(sql`
      INSERT INTO students (
        studentid, name, grade, average, schoolname, region,
        educationalstageid, classname, administration, schoolcode,
        section, subjects
      ) VALUES (
        ${data.studentid},
        ${data.name},
        ${data.grade || ''},
        ${parseFloat(data.average) || 0},
        ${data.schoolname || ''},
        ${data.region || ''},
        ${data.educationalstageid || ''},
        ${data.classname || ''},
        ${data.administration || ''},
        ${data.schoolcode || ''},
        ${data.section || ''},
        ${subjectsJson}
      )
    `);
    
    return c.json({ success: true, message: 'تم إضافة الطالب بنجاح' });
  } catch (e) {
    return c.json({ error: 'Failed to add student', details: e.message }, 500);
  }
});

// Delete Student
app.delete('/api/admin/students/:id', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  
  try {
    await db.delete(students)
      .where(sql`studentid = ${id}`)
      .run();
    
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Failed to delete student', details: e.message }, 500);
  }
});

// Delete All Students
app.delete('/api/admin/students', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    await db.delete(students).run();
    return c.json({ success: true, message: 'All students deleted' });
  } catch (e) {
    return c.json({ error: 'Failed to delete all students', details: e.message }, 500);
  }
});

// 🆕 CSV Upload Endpoint
app.post('/api/admin/upload-csv', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const form = await c.req.formData();
    const file = form.get('file');
    
    if (!file) {
      return c.json({ error: 'No file uploaded' }, 400);
    }

    const text = await file.text();
    const lines = text.trim().split('\n');
    
    if (lines.length < 2) {
      return c.json({ error: 'Empty file' }, 400);
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const qs = new URL(c.req.url).searchParams;
    const qsStage = qs.get('stageid') || '';
    const qsRegion = qs.get('region') || '';

    let inserted = 0;
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((h, idx) => (row[h] = values[idx] ?? ''));

      const subjectsJson = (() => {
        if (!row.subjects) return '[]';
        try { return JSON.stringify(JSON.parse(row.subjects)); } catch { return '[]'; }
      })();

      await db.run(sql`
        INSERT OR REPLACE INTO students (
          studentid, name, grade, average, schoolname, region,
          educationalstageid, classname, administration, schoolcode, section, subjects
        ) VALUES (
          ${row.studentid || row.student_id || ''},
          ${row.name || ''},
          ${row.grade || ''},
          ${parseFloat(row.average) || 0},
          ${row.schoolname || row.school_name || ''},
          ${qsRegion || row.region || ''},
          ${qsStage || row.educationalstageid || row.stage_id || ''},
          ${row.classname || row.class_name || ''},
          ${row.administration || ''},
          ${row.schoolcode || row.school_code || ''},
          ${row.section || ''},
          ${subjectsJson}
        )
      `);
      inserted++;
    }
    
    return c.json({ 
      success: true, 
      message: `تم رفع ${inserted} طالب`, 
      total: inserted 
    });
  } catch (e) {
    return c.json({ error: 'فشل الرفع', details: e.message }, 500);
  }
});

// 🆕 JSON Bulk Import
app.post('/api/admin/import-students', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const body = await c.req.json();
    
    if (!Array.isArray(body) || body.length === 0) {
      return c.json({ error: 'Invalid payload' }, 400);
    }
    
    let inserted = 0;
    for (const row of body) {
      const subjects = JSON.stringify(row.subjects || []);
      
      await db.run(sql`
        INSERT OR REPLACE INTO students (
          studentid, name, grade, average, schoolname, region,
          educationalstageid, classname, administration, schoolcode, section, subjects
        ) VALUES (
          ${row.studentid || ''},
          ${row.name || ''},
          ${row.grade || ''},
          ${parseFloat(row.average) || 0},
          ${row.schoolname || ''},
          ${row.region || ''},
          ${row.educationalstageid || ''},
          ${row.classname || ''},
          ${row.administration || ''},
          ${row.schoolcode || ''},
          ${row.section || ''},
          ${subjects}
        )
      `);
      inserted++;
    }
    
    return c.json({ success: true, message: `تم استيراد ${inserted} طالب` });
  } catch (e) {
    return c.json({ error: 'فشل الاستيراد', details: e.message }, 500);
  }
});

// Stages Management
app.get('/api/admin/stages', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const results = await db.select()
      .from(stages)
      .orderBy(stages.displayorder)
      .all();

    const parsedResults = results.map(stage => ({
      ...stage,
      regions: stage.regions ? JSON.parse(stage.regions) : []
    }));

    return c.json(parsedResults);
  } catch (e) {
    return c.json([]);
  }
});

app.post('/api/admin/stages', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const stageData = await c.req.json();
  
  try {
    const regionsJson = JSON.stringify(stageData.regions || []);
    
    await db.run(sql`
      INSERT INTO stages (name, nameen, description, icon, color, regions, displayorder, isactive)
      VALUES (
        ${stageData.name},
        ${stageData.nameen},
        ${stageData.description || ''},
        ${stageData.icon || '📚'},
        ${stageData.color || '#3b82f6'},
        ${regionsJson},
        ${stageData.displayorder || 0},
        1
      )
    `);
    
    return c.json({ success: true, message: 'تم إضافة المرحلة بنجاح' });
  } catch (e) {
    return c.json({ error: 'Failed to add stage', details: e.message }, 500);
  }
});

app.put('/api/admin/stages/:id', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const stageData = await c.req.json();
  
  try {
    const regionsJson = JSON.stringify(stageData.regions || []);
    
    await db.run(sql`
      UPDATE stages
      SET name = ${stageData.name},
          nameen = ${stageData.nameen},
          description = ${stageData.description || ''},
          icon = ${stageData.icon || '📚'},
          color = ${stageData.color || '#3b82f6'},
          regions = ${regionsJson},
          displayorder = ${stageData.displayorder || 0}
      WHERE id = ${id}
    `);
    
    return c.json({ success: true, message: 'تم تحديث المرحلة بنجاح' });
  } catch (e) {
    return c.json({ error: 'Failed to update stage', details: e.message }, 500);
  }
});

app.delete('/api/admin/stages/:id', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  
  try {
    await db.delete(stages).where(sql`id = ${id}`).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Failed to delete stage', details: e.message }, 500);
  }
});

// Content Management
app.put('/api/admin/content', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const contentData = await c.req.json();
  
  try {
    const featuresJson = JSON.stringify(contentData.features || []);
    const contactinfoJson = JSON.stringify(contentData.contactinfo || {});
    const sociallinksJson = JSON.stringify(contentData.sociallinks || {});

    const existing = await db.select().from(content).limit(1).get();

    if (existing) {
      await db.run(sql`
        UPDATE content
        SET pagetitle = ${contentData.pagetitle},
            metadescription = ${contentData.metadescription},
            seokeywords = ${contentData.seokeywords},
            herotitle = ${contentData.herotitle},
            herosubtitle = ${contentData.herosubtitle},
            aboutsection = ${contentData.aboutsection},
            features = ${featuresJson},
            footertext = ${contentData.footertext},
            contactinfo = ${contactinfoJson},
            sociallinks = ${sociallinksJson}
        WHERE id = ${existing.id}
      `);
    } else {
      await db.run(sql`
        INSERT INTO content
        (pagetitle, metadescription, seokeywords, herotitle, herosubtitle,
         aboutsection, features, footertext, contactinfo, sociallinks)
        VALUES (
          ${contentData.pagetitle},
          ${contentData.metadescription},
          ${contentData.seokeywords},
          ${contentData.herotitle},
          ${contentData.herosubtitle},
          ${contentData.aboutsection},
          ${featuresJson},
          ${contentData.footertext},
          ${contactinfoJson},
          ${sociallinksJson}
        )
      `);
    }

    return c.json({ success: true, message: 'تم تحديث المحتوى بنجاح' });
  } catch (e) {
    return c.json({ error: 'Failed to update content', details: e.message }, 500);
  }
});

// FAQs Management
app.get('/api/admin/faqs', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const results = await db.select().from(faqs).orderBy(faqs.displayorder).all();
    return c.json(results);
  } catch (e) {
    return c.json([]);
  }
});

app.post('/api/admin/faqs', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const data = await c.req.json();
  
  try {
    await db.run(sql`
      INSERT INTO faqs (question, answer, category, displayorder, isactive)
      VALUES (${data.question}, ${data.answer}, ${data.category || ''}, ${data.displayorder || 0}, 1)
    `);
    return c.json({ success: true, message: 'تم إضافة السؤال بنجاح' });
  } catch (e) {
    return c.json({ error: 'Failed to add FAQ', details: e.message }, 500);
  }
});

app.put('/api/admin/faqs/:id', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const data = await c.req.json();
  
  try {
    await db.run(sql`
      UPDATE faqs
      SET question = ${data.question},
          answer = ${data.answer},
          category = ${data.category || ''},
          displayorder = ${data.displayorder || 0}
      WHERE id = ${id}
    `);
    return c.json({ success: true, message: 'تم تحديث السؤال بنجاح' });
  } catch (e) {
    return c.json({ error: 'Failed to update FAQ', details: e.message }, 500);
  }
});

app.delete('/api/admin/faqs/:id', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  
  try {
    await db.delete(faqs).where(sql`id = ${id}`).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Failed to delete FAQ', details: e.message }, 500);
  }
});

// Guides Management
app.get('/api/admin/guides', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const results = await db.select().from(guides).orderBy(guides.displayorder).all();
    return c.json(results);
  } catch (e) {
    return c.json([]);
  }
});

app.post('/api/admin/guides', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const data = await c.req.json();
  
  try {
    await db.run(sql`
      INSERT INTO guides (title, content, icon, displayorder, isactive)
      VALUES (${data.title}, ${data.content}, ${data.icon || '📖'}, ${data.displayorder || 0}, 1)
    `);
    return c.json({ success: true, message: 'تم إضافة الدليل بنجاح' });
  } catch (e) {
    return c.json({ error: 'Failed to add guide', details: e.message }, 500);
  }
});

app.put('/api/admin/guides/:id', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const data = await c.req.json();
  
  try {
    await db.run(sql`
      UPDATE guides
      SET title = ${data.title},
          content = ${data.content},
          icon = ${data.icon || '📖'},
          displayorder = ${data.displayorder || 0}
      WHERE id = ${id}
    `);
    return c.json({ success: true, message: 'تم تحديث الدليل بنجاح' });
  } catch (e) {
    return c.json({ error: 'Failed to update guide', details: e.message }, 500);
  }
});

app.delete('/api/admin/guides/:id', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  
  try {
    await db.delete(guides).where(sql`id = ${id}`).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Failed to delete guide', details: e.message }, 500);
  }
});

// News Management
app.get('/api/admin/news', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  
  try {
    const results = await db.select().from(news).orderBy(sql`publishdate DESC`).all();
    return c.json(results);
  } catch (e) {
    return c.json([]);
  }
});

app.post('/api/admin/news', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const data = await c.req.json();
  
  try {
    await db.run(sql`
      INSERT INTO news (title, content, publishdate, isactive)
      VALUES (${data.title}, ${data.content}, ${data.publishdate || new Date().toISOString()}, 1)
    `);
    return c.json({ success: true, message: 'تم إضافة الخبر بنجاح' });
  } catch (e) {
    return c.json({ error: 'Failed to add news', details: e.message }, 500);
  }
});

app.put('/api/admin/news/:id', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const data = await c.req.json();
  
  try {
    await db.run(sql`
      UPDATE news
      SET title = ${data.title},
          content = ${data.content},
          publishdate = ${data.publishdate || new Date().toISOString()}
      WHERE id = ${id}
    `);
    return c.json({ success: true, message: 'تم تحديث الخبر بنجاح' });
  } catch (e) {
    return c.json({ error: 'Failed to update news', details: e.message }, 500);
  }
});

app.delete('/api/admin/news/:id', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  
  try {
    await db.delete(news).where(sql`id = ${id}`).run();
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: 'Failed to delete news', details: e.message }, 500);
  }
});

// Alias for admin upload endpoint -> proxy to public /api/students/upload
app.post('/api/admin/students/upload', authMiddleware, async (c) => {
 try {
 const targetUrl = c.req.url.replace('/api/admin/students/upload', '/api/students/upload');
 const forwarded = new Request(targetUrl, {
 method: c.req.method,
 headers: c.req.headers,
 body: c.req.body
 });

 return app.fetch(forwarded);
 } catch (e) {
 return c.json({ error: 'Failed to proxy upload', details: e.message },500);
 }
});

export default app;
