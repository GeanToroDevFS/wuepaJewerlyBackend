import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { Order, OrderStatus } from '../models/Order';

const ordersCollection = db.collection('pedidos');

export class OrderDAO {
  static async createOrder(
    orderData: Omit<Order, 'id' | 'fechaCreacion' | 'fechaActualizacion'>
  ): Promise<Order> {
    const orderRef = ordersCollection.doc();
    const now = admin.firestore.Timestamp.now();
    const orderToSave = {
      ...orderData,
      fechaCreacion: now,
      fechaActualizacion: now,
    };

    await orderRef.set(orderToSave);

    return {
      id: orderRef.id,
      ...orderToSave,
    };
  }

  static async getOrderById(id: string): Promise<Order | null> {
    const doc = await ordersCollection.doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...(doc.data() as Omit<Order, 'id'>),
    };
  }

  static async getAdminOrders(): Promise<Order[]> {
    const snapshot = await ordersCollection
      .orderBy('fechaCreacion', 'desc')
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Order, 'id'>),
    }));
  }

  static async updateOrderStatus(
    id: string,
    status: OrderStatus
  ): Promise<Order | null> {
    const orderRef = ordersCollection.doc(id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return null;
    }

    await orderRef.update({
      estado: status,
      fechaActualizacion: admin.firestore.Timestamp.now(),
    });

    const updated = await orderRef.get();

    return {
      id: updated.id,
      ...(updated.data() as Omit<Order, 'id'>),
    };
  }
}
