import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables from backend/.env or root .env
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

const dbConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cgpa_calculator_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  multipleStatements: true
};

if (process.env.DB_SOCKET_PATH && fs.existsSync(process.env.DB_SOCKET_PATH)) {
  dbConfig.socketPath = process.env.DB_SOCKET_PATH;
}

export const pool = mysql.createPool(dbConfig);

/**
 * Ensures the target database exists before attempting pool connections
 */
export async function ensureDatabaseExists(): Promise<void> {
  const bootstrapConfig: mysql.ConnectionOptions = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };

  if (process.env.DB_SOCKET_PATH && fs.existsSync(process.env.DB_SOCKET_PATH)) {
    bootstrapConfig.socketPath = process.env.DB_SOCKET_PATH;
  }

  const connection = await mysql.createConnection(bootstrapConfig);
  try {
    const dbName = process.env.DB_NAME || 'cgpa_calculator_db';
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    console.log(`[DB] Database '${dbName}' verified/created successfully`);
  } finally {
    await connection.end();
  }
}

/**
 * Initializes database tables using schema.sql if they do not exist
 */
export async function initializeDatabase(): Promise<void> {
  // First ensure the database itself exists
  await ensureDatabaseExists();

  const candidatePaths = [
    path.join(__dirname, 'schema.sql'),
    path.join(__dirname, '..', '..', 'src', 'config', 'schema.sql'),
    path.join(process.cwd(), 'src', 'config', 'schema.sql'),
    path.join(process.cwd(), 'backend', 'src', 'config', 'schema.sql')
  ];

  const schemaPath = candidatePaths.find(p => fs.existsSync(p));
  if (!schemaPath) {
    console.warn(`[DB] Schema file not found in candidates: ${candidatePaths.join(', ')}`);
    return;
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  const connection = await pool.getConnection();
  try {
    await connection.query(sql);
    console.log('[DB] Database tables initialized successfully');
  } catch (err) {
    console.error('[DB] Failed initializing database schema:', err);
    throw err;
  } finally {
    connection.release();
  }
}

export default pool;
