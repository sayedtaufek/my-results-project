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

    // Parse subjects JSON for each student
    const parsedResults = results.map(student => ({
      ...student,
      subjects: student.subjects ? JSON.parse(student.subjects) : []
    }));

    return c.json({ 
      results: parsedResults, 
      students: parsedResults, // للتوافق مع Frontend
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
    // إذا الجدول مش موجود، إرجاع بيانات افتراضية
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

  // Default content
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
  const { username, password } = await c.req.json();
  
  // TODO: استبدل بالتحقق من قاعدة البيانات
  if (username === 'admin' && password === 'admin123') {
    const token = await new jose.SignJWT({ username: 'admin', role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(secret);

    return c.json({ 
      success: true, 
      accesstoken: token 
    });
  }

  return c.json({ success: false, message: 'Invalid credentials' }, 401);
});

// ==================== Admin Protected Endpoints ====================

// Get All Students (Admin)
app.get('/api/admin/students', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const { skip = '0', limit = '10' } = c.req.query();
  
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

// Upload Excel Data (Process)
app.post('/api/students/upload', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const studentsData = await c.req.json();

  if (!Array.isArray(studentsData) || studentsData.length === 0) {
    return c.json({ error: 'Invalid data format' }, 400);
  }

  try {
    const insertPromises = studentsData.map(student => {
      const subjectsJson = JSON.stringify(student.subjects || []);
      
      return db.run(sql`
        INSERT OR REPLACE INTO students 
        (studentid, name, grade, average, schoolname, region, 
         educationalstageid, classname, administration, schoolcode, 
         section, subjects, createdat)
        VALUES (
          ${student.studentid},
          ${student.name},
          ${student.grade},
          ${parseFloat(student.average) || 0},
          ${student.schoolname || ''},
          ${student.region || ''},
          ${student.educationalstageid || ''},
          ${student.classname || ''},
          ${student.administration || ''},
          ${student.schoolcode || ''},
          ${student.section || ''},
          ${subjectsJson},
          ${student.createdat || new Date().toISOString()}
        )
      `);
    });

    await Promise.all(insertPromises);

    return c.json({ 
      success: true, 
      message: `تم رفع ${studentsData.length} طالب بنجاح`,
      totalprocessed: studentsData.length
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ 
      error: 'فشل رفع البيانات', 
      details: error.message 
    }, 500);
  }
});

// Process Excel with Mapping
app.post('/api/admin/process-excel', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const mapping = await c.req.json();
  const { filehash, educationalstageid, region } = c.req.query();

  // في الواقع، ستحتاج لتخزين بيانات Excel مؤقتاً
  // هنا مثال بسيط - يفترض أن البيانات تُرسل مباشرة
  
  return c.json({ 
    success: true, 
    message: 'Excel processing endpoint ready',
    note: 'يحتاج implementation كامل مع file storage'
  });
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
app.get('/api/admin/content', authMiddleware, async (c) => {
  // Same as public /api/content but requires auth
  return app.fetch(new Request(c.req.url.replace('/admin/content', '/content')));
});

app.put('/api/admin/content', authMiddleware, async (c) => {
  const db = drizzle(c.env.DB);
  const contentData = await c.req.json();

  try {
    const featuresJson = JSON.stringify(contentData.features || []);
    const contactinfoJson = JSON.stringify(contentData.contactinfo || {});
    const sociallinksJson = JSON.stringify(contentData.sociallinks || {});

    // Check if content exists
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

// ==================== Health Check ====================
app.get('/', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'Student Results API is running',
    version: '2.0',
    endpoints: {
      public: [
        'GET /api/stages',
        'POST /api/search',
        'GET /api/content',
        'GET /api/stats'
      ],
      admin: [
        'POST /api/admin/login',
        'GET /api/admin/students',
        'POST /api/students/upload',
        'DELETE /api/admin/students/:id',
        'GET /api/admin/stages',
        'POST /api/admin/stages',
        'PUT /api/admin/stages/:id',
        'DELETE /api/admin/stages/:id'
      ]
    }
  });
});

export default app;
