import { db } from '../config/firebase';
import admin from 'firebase-admin';
import { User } from '../models/User';

export class UserDAO {

  static async createUser(userData: User): Promise<User> {
    console.log('🔹 [USERDAO] Creando usuario...');

    const userRef = db.collection('usuarios').doc(userData.uid);

    const userToSave: User = {
      ...userData,
      fechaRegistro: admin.firestore.Timestamp.now()
    };

    await userRef.set(userToSave);

    console.log('✅ [USERDAO] Usuario creado');

    return userToSave;
  }

  static async getUserById(uid: string): Promise<User | null> {
    console.log('🔹 [USERDAO] Buscando por ID:', uid);

    const docSnap = await db.collection('usuarios').doc(uid).get();

    if (!docSnap.exists) return null;

    return {
      uid,
      ...docSnap.data()
    } as User;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    console.log('🔹 [USERDAO] Buscando por email:', email);

    const snapshot = await db
      .collection('usuarios')
      .where('correo', '==', email)
      .limit(1)
      .get();

    if (snapshot.empty) return null;

    const doc = snapshot.docs[0];

    return {
      uid: doc.id,
      ...doc.data()
    } as User;
  }

  static async updateUser(uid: string, updates: Partial<User>): Promise<User> {
    console.log('🔹 [USERDAO] Actualizando:', uid);

    const ref = db.collection('usuarios').doc(uid);

    await ref.update(updates);

    const updated = await ref.get();

    return {
      uid,
      ...updated.data()
    } as User;
  }

  static async deleteUser(uid: string): Promise<void> {
    console.log('🔹 [USERDAO] Eliminando:', uid);

    await db.collection('usuarios').doc(uid).delete();
  }
}