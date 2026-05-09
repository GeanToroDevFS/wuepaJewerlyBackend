import admin from 'firebase-admin';

export interface User {
  uid: string;
  correo: string;
  nombre: string;
  apellidos?: string;
  rol: 'cliente' | 'admin';
  telefono?: number;
  direccion?: string;
  birthdate?: admin.firestore.Timestamp;
  fechaRegistro?: admin.firestore.Timestamp;
}