import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { OrderDAO } from '../dao/OrderDAO';
import { Order, OrderCustomerData, OrderItem, OrderStatus } from '../models/Order';

interface CreateOrderInput {
  clienteId: string;
  productos: Array<{ id: string; cantidad: number }>;
  clienteData: OrderCustomerData;
}

export class OrderService {
  static async createOrder(input: CreateOrderInput): Promise<Order> {
    if (!input.productos || input.productos.length === 0) {
      throw new Error('El pedido debe incluir al menos un producto');
    }

    const normalizedItems = input.productos.map((item) => ({
      id: String(item.id || '').trim(),
      cantidad: Number(item.cantidad),
    }));

    if (normalizedItems.some((item) => !item.id || !Number.isInteger(item.cantidad) || item.cantidad <= 0)) {
      throw new Error('Los productos del pedido son invalidos');
    }

    const orderItems: OrderItem[] = [];
    let total = 0;

    await db.runTransaction(async (transaction) => {
      for (const item of normalizedItems) {
        const productRef = db.collection('productos').doc(item.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Producto no encontrado: ${item.id}`);
        }

        const productData = productDoc.data() || {};
        const stock = Number(productData.stock || 0);
        const price = Number(productData.precio || 0);

        if (stock < item.cantidad) {
          throw new Error(`No hay suficientes unidades de ${productData.nombre || 'este producto'}`);
        }

        const subtotal = price * item.cantidad;

        orderItems.push({
          productId: productDoc.id,
          codigo: String(productData.codigo || ''),
          nombre: String(productData.nombre || 'Producto'),
          imagenUrl: String(productData.imagenUrl || ''),
          cantidad: item.cantidad,
          precioUnitario: price,
          subtotal,
        });

        total += subtotal;
      }
    });

    return OrderDAO.createOrder({
      clienteId: input.clienteId,
      productos: orderItems,
      total,
      estado: 'Pendiente',
      clienteData: input.clienteData,
    });
  }

  static async getAdminOrders(): Promise<Order[]> {
    return OrderDAO.getAdminOrders();
  }

  static async getOrderById(orderId: string): Promise<Order | null> {
    return OrderDAO.getOrderById(orderId);
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    if (status !== 'Pagado') {
      return OrderDAO.updateOrderStatus(orderId, status);
    }

    const orderRef = db.collection('pedidos').doc(orderId);

    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error('Pedido no encontrado');
      }

      const orderData = orderDoc.data() as Omit<Order, 'id'>;

      if (orderData.estado === 'Pagado') {
        return;
      }

      const productUpdates = [];

      for (const item of orderData.productos || []) {
        const productRef = db.collection('productos').doc(item.productId);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Producto no encontrado: ${item.nombre}`);
        }

        const productData = productDoc.data() || {};
        const currentStock = Number(productData.stock || 0);
        const nextStock = Math.max(0, currentStock - item.cantidad);

        productUpdates.push({ productRef, nextStock });
      }

      productUpdates.forEach(({ productRef, nextStock }) => {
        transaction.update(productRef, { stock: nextStock });
      });

      transaction.update(orderRef, {
        estado: 'Pagado',
        fechaActualizacion: admin.firestore.Timestamp.now(),
      });
    });

    return OrderDAO.getOrderById(orderId);
  }
}
