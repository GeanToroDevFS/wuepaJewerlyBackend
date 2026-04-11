import { Request, Response, NextFunction } from 'express';

export const corsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.header('Access-Control-Allow-Origin', '*'); // ⚠️ en producción usa tu dominio
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};