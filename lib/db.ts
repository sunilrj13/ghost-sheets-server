import mysql from 'mysql2/promise';

const globalForDb = global as unknown as { pool: mysql.Pool };

export const pool =
  globalForDb.pool ||
  (process.env.DATABASE_URL
    ? mysql.createPool(process.env.DATABASE_URL)
    : mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ghost_sheets_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      }));

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool;

export default pool;
