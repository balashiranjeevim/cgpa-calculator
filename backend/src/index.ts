import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { initializeDatabase } from './config/db';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer(): Promise<void> {
  try {
    console.log('[Server] Initializing database schema...');
    await initializeDatabase();

    const app = createApp();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] CGPA Calculator API running at http://localhost:${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/api/health`);
      console.log(`[Server] Semesters API: http://localhost:${PORT}/api/semesters`);
      console.log(`[Server] CGPA API: http://localhost:${PORT}/api/cgpa`);
    });
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
}

startServer();
