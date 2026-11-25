import express, { type NextFunction, type Request, type Response } from 'express';
import { registerApiRoutes } from '../src/server/app.ts';

const app = express();

// Ensure /api prefix is preserved even if Vercel rewrite strips it
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
  }
  next();
});

registerApiRoutes(app);

export default app;
