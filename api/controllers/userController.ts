import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { UserDAO } from '../dao/UserDAO';

/**
 * Obtener perfil del usuario autenticado
 */
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const user = await UserDAO.getUserById(uid);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ [GET PROFILE]', error);

    res.status(500).json({
      success: false,
      message: 'Error interno'
    });
  }
};

/**
 * Actualizar perfil
 */
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    const { nombre, telefono, direccion } = req.body;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const updatedUser = await UserDAO.updateUser(uid, {
      nombre,
      telefono,
      direccion
    });

    res.json({
      success: true,
      message: 'Perfil actualizado',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ [UPDATE PROFILE]', error);

    res.status(500).json({
      success: false,
      message: 'Error actualizando perfil'
    });
  }
};

/**
 * Eliminar cuenta
 */
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    await UserDAO.deleteUser(uid);

    res.json({
      success: true,
      message: 'Cuenta eliminada'
    });

  } catch (error) {
    console.error('❌ [DELETE ACCOUNT]', error);

    res.status(500).json({
      success: false,
      message: 'Error eliminando cuenta'
    });
  }
};