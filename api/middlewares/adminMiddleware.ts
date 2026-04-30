import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { db } from '../config/firebase';

export const adminMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    // 🔥 Consultar usuario en Firestore
    const userDoc = await db.collection('Usuarios').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const userData = userDoc.data();

    if (userData?.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso solo para administradores'
      });
    }

    next();
  } catch (error) {
    console.error('❌ [ADMIN MIDDLEWARE]', error);

    return res.status(500).json({
      success: false,
      message: 'Error validando admin'
    });
  }
};