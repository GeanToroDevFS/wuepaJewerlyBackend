import { Request, Response } from 'express';
import { auth } from '../config/firebase';
import { UserDAO } from '../dao/UserDAO';
import { sendRecoveryEmail } from '../services/emailService';

export class AuthController {
  private userDAO = UserDAO;

  // ✅ REGISTER (sin crear en Firebase, solo backend)
  async register(req: Request, res: Response) {
    console.log('🔵 [REGISTER]');

    try {
      const { token, nombre, telefono, direccion } = req.body;

      if (!token || !nombre) {
        return res.status(400).json({
          success: false,
          message: 'Token y nombre son requeridos'
        });
      }

      const decoded = await auth.verifyIdToken(token);

      const user = await this.userDAO.createUser({
        uid: decoded.uid,
        correo: decoded.email || '',
        nombre,
        rol: 'cliente',
        telefono,
        direccion
      });

      return res.status(201).json({
        success: true,
        user
      });

    } catch (error) {
      console.error('❌ [REGISTER]', error);

      return res.status(400).json({
        success: false,
        message: 'Error registrando usuario'
      });
    }
  }

  // ✅ FORGOT (opcional si usas Firebase)
  async forgotPassword(req: Request, res: Response) {
    console.log('🔴 [FORGOT]');

    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email requerido'
        });
      }

      const resetToken = Buffer
        .from(`${email}-${Date.now()}-${Math.random()}`)
        .toString('base64');

      await sendRecoveryEmail(email, resetToken);

      return res.json({
        success: true,
        message: 'Email enviado'
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error enviando email'
      });
    }
  }

  // ✅ LOGIN REAL (validación backend)
  async verifyToken(req: Request, res: Response) {
    console.log('🟡 [VERIFY]');

    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token requerido'
        });
      }

      const decoded = await auth.verifyIdToken(token);

      let user = await this.userDAO.getUserById(decoded.uid);

      if (!user) {
        user = await this.userDAO.createUser({
          uid: decoded.uid,
          correo: decoded.email || '',
          nombre: decoded.name || 'Usuario',
          rol: 'cliente'
        });
      }

      return res.json({
        success: true,
        user
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  }
}