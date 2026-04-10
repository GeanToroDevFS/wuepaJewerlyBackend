export interface User {
  uid: string;
  correo: string;
  nombre: string;
  rol: 'cliente' | 'admin';
  telefono?: number;
  direccion?: string;
  fechaRegistro?: Date;
}