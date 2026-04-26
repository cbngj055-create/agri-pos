import { pool } from './db/index.js';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const now = Math.floor(Date.now() / 1000);

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 بدء إضافة البيانات التجريبية...');

    // 1. إنشاء مستخدم تجريبي
    const userId = uuid();
    const storeId = uuid();
    const hashedPassword = await bcrypt.hash('123456', 10);

    await client.query(
      `INSERT INTO users (id, username, email, password_hash, store_id, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT DO NOTHING`,
      [userId, 'demo', 'demo@example.com', hashedPassword, storeId, 'owner', now, now]
    );

    // 2. إنشاء محل تجاري
    await client.query(
      `INSERT INTO stores (id, name, owner_id, address, phone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [storeId, 'محل الزراعة النموذجي', userId, 'القاهرة', '01000000000', now, now]
    );

    // 3. إضافة فئات منتجات
    const categories = ['الخضار', 'الفاكهة', 'البذور', 'الأسمدة'];
    const categoryIds: { [key: string]: string } = {};

    for (const cat of categories) {
      const catId = uuid();
      categoryIds[cat] = catId;
      await client.query(
        `INSERT INTO categories (id, name, store_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
        [catId, cat, storeId, now, now]
      );
    }

    // 4. إضافة منتجات تجريبية
    const products = [
      { name: 'طماطم', category: 'الخضار', price: 5, buy: 3 },
      { name: 'خيار', category: 'الخضار', price: 4, buy: 2 },
      { name: 'تفاح', category: 'الفاكهة', price: 8, buy: 5 },
      { name: 'برتقال', category: 'الفاكهة', price: 7, buy: 4 },
      { name: 'بذور طماطم', category: 'البذور', price: 50, buy: 30 },
      { name: 'سماد عضوي', category: 'الأسمدة', price: 100, buy: 60 },
    ];

    for (const prod of products) {
      const prodId = uuid();
      await client.query(
        `INSERT INTO products (id, name, category, sale_price, purchase_price, stock, store_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT DO NOTHING`,
        [prodId, prod.name, categoryIds[prod.category], prod.price, prod.buy, 100, storeId, now, now]
      );
    }

    // 5. إضافة عملاء تجريبيين
    const customers = ['أحمد', 'فاطمة', 'محمد', 'سارة'];
    for (const custName of customers) {
      const custId = uuid();
      await client.query(
        `INSERT INTO customers (id, name, phone, store_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING`,
        [custId, custName, '01000000000', storeId, now, now]
      );
    }

    console.log('✅ تم إضافة البيانات التجريبية بنجاح!');
    console.log('📝 بيانات الدخول:');
    console.log('   البريد: demo@example.com');
    console.log('   كلمة المرور: 123456');

  } catch (err) {
    console.error('❌ خطأ:', err);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

seed();
