import * as admin from 'firebase-admin';

export interface CartItem {
  productId: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  imagenUrl: string;
  cantidad: number;
  precio: number;
  unidadesDisponibles: number;
}

export interface Cart {
  clienteId: string;
  productos: CartItem[];
  fechaActualizacion: admin.firestore.Timestamp;
}
