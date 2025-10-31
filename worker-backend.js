import { Hono } from 'hono';
import * as jose from 'jose';
import * as bcrypt from 'bcrypt-ts'; // استيراد المكتبة الجديدة

const app = new Hono();

const JWT_SECRET = 'your-super-secret-key-that-is-long-and-secure';
const secret = new TextEncoder().encode(JWT_SECRET);

// مثال: إنشاء مستخدم جديد وتشفير كلمة المرور
app.post('/api/register', async (c) => {
  const body = await c.req.json();
  const { username, password } = body;

  if (!password) {
    return c.json({ error: 'Password is required' }, 400);
  }

  // تشفير كلمة المرور باستخدام المكتبة الجديدة
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

  // هنا ستقوم بحفظ username و hashedPassword في قاعدة البيانات D1
  
  return c.json({ success: true, username: username, message: 'User registered' });
});

// مثال: تسجيل الدخول والتحقق من كلمة المرور
app.post('/api/login', async (c) => {
  const body = await c.req.json();
  const { username, password } = body;

  // في مشروع حقيقي، ستجلب كلمة المرور المشفرة من قاعدة البيانات
  const hashedPasswordFromDb = await bcrypt.hash('password', 10); // هذا مجرد مثال
  const userFromDb = { username: 'admin', password: hashedPasswordFromDb };

  if (username === userFromDb.username) {
    // مقارنة كلمة المرور المدخلة مع الكلمة المشفرة
    const isMatch = await bcrypt.compare(password, userFromDb.password);
    
    if (isMatch) {
      const token = await new jose.SignJWT({ userId: 1, username: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('2h')
        .sign(secret);
      return c.json({ success: true, token: token });
    }
  }

  return c.json({ success: false, message: 'Invalid credentials' }, 401);
});

export default app;