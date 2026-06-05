import { Order } from '../models/Order';
import { OrderService } from './orderService';

interface WebhookPayload {
  orderId?: string;
  status?: string;
}

export class PaymentService {
  static async markOrderAsPaid(orderId: string): Promise<Order | null> {
    return OrderService.updateOrderStatus(orderId, 'Pagado');
  }

  static async processWebhook(payload: WebhookPayload): Promise<Order | null> {
    if (!payload.orderId || payload.status !== 'Pagado') {
      return null;
    }

    return this.markOrderAsPaid(payload.orderId);
  }
}
