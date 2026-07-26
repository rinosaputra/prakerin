import { db } from './db/index';
import { users } from './lib/schema';
import bcrypt from 'bcrypt';

async function seed() {
  try {
    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Insert admin user
    await db.insert(users).values({
      email: 'admin@smk.sch.id',
      passwordHash,
      role: 'ADMIN_TU',
      namaLengkap: 'Admin TU',
      isActive: true,
    });

    console.log('✅ Admin user seeded successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();