import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { OrderCustomerData, OrderStatus } from '../models/Order';
import { OrderService } from '../services/orderService';
import { db } from '../config/firebase';

const validStatuses: OrderStatus[] = ['Pendiente', 'Pagado', 'Cancelado'];
const INTERNATIONAL_PHONE_PATTERN = /^\+?[0-9\s()-]+$/;
const ADDRESS_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s#.,°/-]+$/;

function normalizeCustomerData(data: unknown): OrderCustomerData | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const customerData = data as Partial<OrderCustomerData>;
  const normalizedData = {
    nombre: typeof customerData.nombre === 'string' ? customerData.nombre.trim() : '',
    correo: typeof customerData.correo === 'string' ? customerData.correo.trim() : '',
    telefono: typeof customerData.telefono === 'string' ? customerData.telefono.trim() : '',
    direccion: typeof customerData.direccion === 'string' ? customerData.direccion.trim() : '',
  };
  const phoneDigits = normalizedData.telefono.replace(/\D/g, '');

  if (!normalizedData.nombre || !normalizedData.telefono || !normalizedData.direccion) {
    return null;
  }

  if (
    !INTERNATIONAL_PHONE_PATTERN.test(normalizedData.telefono)
    || phoneDigits.length < 7
    || phoneDigits.length > 15
    || normalizedData.direccion.length < 8
    || normalizedData.direccion.length > 120
    || !ADDRESS_PATTERN.test(normalizedData.direccion)
    || !/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(normalizedData.direccion)
  ) {
    return null;
  }

  return normalizedData;
}

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      return res.status(401).json({
        success: false,
        message: 'Tu sesion vencio. Inicia sesion de nuevo para continuar.',
      });
    }

    const { productos, clienteData } = req.body;

    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tu carrito esta vacio. Agrega al menos un producto para continuar.',
      });
    }

    const normalizedCustomerData = normalizeCustomerData(clienteData);

    if (!normalizedCustomerData) {
      return res.status(400).json({
        success: false,
        message: 'Escribe un telefono y una direccion validos para coordinar la entrega.',
      });
    }

    const order = await OrderService.createOrder({
      clienteId: uid,
      productos,
      clienteData: normalizedCustomerData,
    });

    await db.collection('carritos').doc(uid).delete();

    return res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('[CREATE ORDER]', error);

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'No pudimos guardar tu pedido. Intenta nuevamente.',
    });
  }
};

export const getAdminOrders = async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await OrderService.getAdminOrders();

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('[GET ADMIN ORDERS]', error);

    return res.status(500).json({
      success: false,
      message: 'Error obteniendo pedidos',
    });
  }
};

export const getOrderDetails = async (req: AuthRequest, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const order = await OrderService.getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado',
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('[GET ORDER DETAILS]', error);

    return res.status(500).json({
      success: false,
      message: 'Error obteniendo detalles del pedido',
    });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const orderId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const estado = req.body.estado as OrderStatus | undefined;

    if (!estado || !validStatuses.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Selecciona un estado valido para el pedido.',
      });
    }

    const order = await OrderService.updateOrderStatus(orderId, estado);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado',
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('[UPDATE ORDER STATUS]', error);

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error actualizando estado del pedido',
    });
  }
};
