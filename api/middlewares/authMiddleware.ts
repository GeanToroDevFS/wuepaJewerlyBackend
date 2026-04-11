import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    [key: string]: any;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  console.log('🔐 [MIDDLEWARE] Verificando token...');

  try {
    const authHeader = req.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = await auth.verifyIdToken(token);

    req.user = decoded;

    console.log('✅ [MIDDLEWARE] Token válido:', decoded.uid);

    next();
  } catch (error) {
    console.error('❌ [MIDDLEWARE] Token inválido');

    return res.status(401).json({
      success: false,
      message: 'No autorizado'
    });
  }
};