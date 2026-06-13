import * as admin from 'firebase-admin';

export type OrderStatus = 'Pendiente' | 'Pagado' | 'Cancelado';

export interface OrderItem {
  productId: string;
  codigo: string;
  nombre: string;
  imagenUrl: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface OrderCustomerData {
  nombre: string;
  correo: string;
  telefono: string;
  direccion: string;
}

export interface Order {
  id?: string;
  clienteId: string;
  productos: OrderItem[];
  total: number;
  estado: OrderStatus;
  inventarioDescontado?: boolean;
  clienteData: OrderCustomerData;
  fechaCreacion: admin.firestore.Timestamp;
  fechaActualizacion: admin.firestore.Timestamp;
}
