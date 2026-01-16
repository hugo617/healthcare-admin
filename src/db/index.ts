import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as schema from './schema';

// 导出所有 schema
export * from './schema';

dotenv.config();

// 使用用户的 DATABASE_URL
const connectionString =
  process.env.DATABASE_URL || 'postgresql://star:@localhost:5432/n_admin';

const pool = new pg.Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false
        }
      : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// 设置数据库会话时区为上海时区
pool.on('connect', (client) => {
  client.query('SET timezone = "Asia/Shanghai"');
});

export const db = drizzle(pool, { schema });
