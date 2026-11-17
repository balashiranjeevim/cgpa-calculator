import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import semesterRoutes from './routes/semesterRoutes';
import cgpaRoutes from './routes/cgpaRoutes';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler';

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'CGPA Calculator API',
      timestamp: new Date().toISOString()
    });
  });

  // REST API Routes
  app.use('/api/semesters', semesterRoutes);
  app.use('/api/cgpa', cgpaRoutes);

  // Serve static frontend files if built
  const candidateStaticPaths = [
    path.resolve(__dirname, '../../frontend/dist/frontend/browser'),
    path.resolve(process.cwd(), 'frontend/dist/frontend/browser'),
    path.resolve(__dirname, '../public')
  ];

  const staticDir = candidateStaticPaths.find(p => fs.existsSync(p));
  if (staticDir) {
    app.use(express.static(staticDir));
    // SPA fallback for HTML5 history API navigation
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  // Catch-all 404 handler for unmatched API routes
  app.use(notFoundHandler);

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
