import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { UserDAO } from '../dao/UserDAO';

function calculateAge(
  birthdate?: FirebaseFirestore.Timestamp
): number | null {
  if (!birthdate) {
    return null;
  }
  const birth =
    birthdate.toDate();
  const today =
    new Date();
  let age =
    today.getFullYear() -
    birth.getFullYear();
  const monthDiff =
    today.getMonth() -
    birth.getMonth();
  if (
    monthDiff < 0 ||
    (
      monthDiff === 0 &&
      today.getDate() < birth.getDate()
    )
  ) {
    age--;
  }
  return age;
}



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

    const age =
      calculateAge(user.birthdate);
    res.json({
      success: true,
      user: {
        uid: user.uid,
        correo: user.correo,
        nombre: user.nombre,
        apellidos: user.apellidos || '',
        rol: user.rol || 'cliente',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        birthdate:
          user.birthdate
            ? user.birthdate.toDate()
            : null,
        age,
        fechaRegistro:
          user.fechaRegistro
            ? user.fechaRegistro.toDate()
            : null,
      }
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
    const {nombre, apellidos, telefono, direccion, birthdate} = req.body;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const updates: any = {
      nombre,
      apellidos,
      telefono,
      direccion,
    };
    if (birthdate) {
      updates.birthdate =
        new Date(birthdate);
    }

    const updatedUser =
      await UserDAO.updateUser(
        uid,
        updates
      );
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