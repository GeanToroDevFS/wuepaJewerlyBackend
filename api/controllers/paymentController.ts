import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { PaymentService } from '../services/paymentService';

export const markOrderPaid = async (req: AuthRequest, res: Response) => {
  try {
    const orderId = typeof req.body.orderId === 'string' ? req.body.orderId.trim() : '';

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Debes seleccionar un pedido para marcarlo como pagado.',
      });
    }

    const order = await PaymentService.markOrderAsPaid(orderId);

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
    console.error('[MARK ORDER PAID]', error);

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo marcar el pedido como pagado.',
    });
  }
};

export const paymentWebhook = async (req: Request, res: Response) => {
  try {
    const order = await PaymentService.processWebhook(req.body);

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('[PAYMENT WEBHOOK]', error);

    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo procesar el pago.',
    });
  }
};
