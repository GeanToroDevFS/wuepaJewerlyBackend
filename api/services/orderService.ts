import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { OrderDAO } from '../dao/OrderDAO';
import { Order, OrderCustomerData, OrderItem, OrderStatus } from '../models/Order';

const INTERNATIONAL_PHONE_PATTERN = /^\+?[0-9\s()-]+$/;
const ADDRESS_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s#.,°/-]+$/;

interface CreateOrderInput {
  clienteId: string;
  productos: Array<{ id: string; cantidad: number }>;
  clienteData: OrderCustomerData;
}

export class OrderService {
  static async createOrder(input: CreateOrderInput): Promise<Order> {
    const phoneDigits = input.clienteData.telefono.replace(/\D/g, '');

    if (!input.clienteData.nombre.trim() || !input.clienteData.telefono.trim() || !input.clienteData.direccion.trim()) {
      throw new Error('Escribe tu telefono y direccion para poder continuar con el pedido.');
    }

    const address = input.clienteData.direccion.trim();

    if (
      !INTERNATIONAL_PHONE_PATTERN.test(input.clienteData.telefono.trim())
      || phoneDigits.length < 7
      || phoneDigits.length > 15
    ) {
      throw new Error('El telefono debe incluir entre 7 y 15 numeros y puede usar un prefijo internacional.');
    }

    if (
      address.length < 8
      || address.length > 120
      || !ADDRESS_PATTERN.test(address)
      || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(address)
    ) {
      throw new Error('Escribe una direccion valida de entre 8 y 120 caracteres.');
    }

    if (!input.productos || input.productos.length === 0) {
      throw new Error('Tu carrito esta vacio. Agrega al menos un producto para continuar.');
    }

    const normalizedItems = Array.from(
      input.productos.reduce((items, item) => {
        const id = String(item.id || '').trim();
        const cantidad = Number(item.cantidad);
        items.set(id, (items.get(id) ?? 0) + cantidad);
        return items;
      }, new Map<string, number>()),
      ([id, cantidad]) => ({ id, cantidad }),
    );

    if (normalizedItems.some((item) => !item.id || !Number.isInteger(item.cantidad) || item.cantidad <= 0)) {
      throw new Error('Revisa las cantidades del carrito e intenta nuevamente.');
    }

    const orderItems: OrderItem[] = [];
    let total = 0;
    const orderRef = db.collection('pedidos').doc();
    const now = admin.firestore.Timestamp.now();

    await db.runTransaction(async (transaction) => {
      const productUpdates: Array<{
        productRef: FirebaseFirestore.DocumentReference;
        nextStock: number;
      }> = [];

      for (const item of normalizedItems) {
        const productRef = db.collection('productos').doc(item.id);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error('Uno de los productos ya no esta disponible. Quitalo del carrito e intenta de nuevo.');
        }

        const productData = productDoc.data() || {};
        const stock = Number(productData.stock || 0);
        const price = Number(productData.precio || 0);

        if (stock < item.cantidad) {
          throw new Error(`No hay suficientes unidades de ${productData.nombre || 'uno de los productos'}. Revisa la cantidad en el carrito.`);
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
        productUpdates.push({
          productRef,
          nextStock: stock - item.cantidad,
        });
      }

      productUpdates.forEach(({ productRef, nextStock }) => {
        transaction.update(productRef, { stock: nextStock });
      });

      transaction.set(orderRef, {
        clienteId: input.clienteId,
        productos: orderItems,
        total,
        estado: 'Pendiente',
        inventarioDescontado: true,
        clienteData: {
          nombre: input.clienteData.nombre.trim(),
          correo: input.clienteData.correo.trim(),
          telefono: input.clienteData.telefono.trim(),
          direccion: address,
        },
        fechaCreacion: now,
        fechaActualizacion: now,
      });
    });

    return {
      id: orderRef.id,
      clienteId: input.clienteId,
      productos: orderItems,
      total,
      estado: 'Pendiente',
      inventarioDescontado: true,
      clienteData: {
        nombre: input.clienteData.nombre.trim(),
        correo: input.clienteData.correo.trim(),
        telefono: input.clienteData.telefono.trim(),
        direccion: address,
      },
      fechaCreacion: now,
      fechaActualizacion: now,
    };
  }

  static async getAdminOrders(): Promise<Order[]> {
    return OrderDAO.getAdminOrders();
  }

  static async getOrderById(orderId: string): Promise<Order | null> {
    return OrderDAO.getOrderById(orderId);
  }

  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
    const orderRef = db.collection('pedidos').doc(orderId);

    await db.runTransaction(async (transaction) => {
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error('Pedido no encontrado');
      }

      const orderData = orderDoc.data() as Omit<Order, 'id'>;

      if (orderData.estado === status) {
        return;
      }

      if (orderData.estado !== 'Pendiente') {
        throw new Error('Un pedido finalizado no puede cambiar de estado.');
      }

      if (status === 'Pendiente') {
        return;
      }

      const shouldDeductInventory = status === 'Pagado' && !orderData.inventarioDescontado;
      const shouldRestoreInventory = status === 'Cancelado' && Boolean(orderData.inventarioDescontado);
      const productUpdates: Array<{
        productRef: FirebaseFirestore.DocumentReference;
        nextStock: number;
      }> = [];

      if (shouldDeductInventory || shouldRestoreInventory) {
        for (const item of orderData.productos || []) {
          const productRef = db.collection('productos').doc(item.productId);
          const productDoc = await transaction.get(productRef);

          if (!productDoc.exists) {
            throw new Error(`Producto no encontrado: ${item.nombre}`);
          }

          const productData = productDoc.data() || {};
          const currentStock = Number(productData.stock || 0);

          if (shouldDeductInventory && currentStock < item.cantidad) {
            throw new Error(`No hay suficientes unidades de ${item.nombre}. Revisa el inventario antes de aceptar el pago.`);
          }

          const nextStock = shouldRestoreInventory
            ? currentStock + item.cantidad
            : currentStock - item.cantidad;

          productUpdates.push({ productRef, nextStock });
        }
      }

      productUpdates.forEach(({ productRef, nextStock }) => {
        transaction.update(productRef, { stock: nextStock });
      });

      transaction.update(orderRef, {
        estado: status,
        inventarioDescontado: status === 'Pagado',
        fechaActualizacion: admin.firestore.Timestamp.now(),
      });
    });

    return OrderDAO.getOrderById(orderId);
  }
}
