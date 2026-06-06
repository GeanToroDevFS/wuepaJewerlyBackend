import { Response } from 'express';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';
import { AuthRequest } from '../middlewares/authMiddleware';
import { CartItem } from '../models/Cart';

interface RequestedCartItem {
  productId: string;
  cantidad: number;
}

function normalizeRequestedItems(value: unknown): RequestedCartItem[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value.map((item) => {
    const candidate = item as Partial<RequestedCartItem>;
    return {
      productId: typeof candidate.productId === 'string' ? candidate.productId.trim() : '',
      cantidad: Number(candidate.cantidad),
    };
  });

  if (normalized.some((item) => !item.productId || !Number.isInteger(item.cantidad) || item.cantidad < 1)) {
    return null;
  }

  return normalized;
}

async function buildCartItems(requestedItems: RequestedCartItem[]): Promise<CartItem[]> {
  const uniqueItems = Array.from(
    requestedItems.reduce((items, item) => {
      items.set(item.productId, (items.get(item.productId) ?? 0) + item.cantidad);
      return items;
    }, new Map<string, number>()),
    ([productId, cantidad]) => ({ productId, cantidad }),
  );

  return Promise.all(uniqueItems.map(async ({ productId, cantidad }) => {
    const snapshot = await db.collection('productos').doc(productId).get();

    if (!snapshot.exists) {
      throw new Error('Uno de los productos ya no esta disponible.');
    }

    const product = snapshot.data() ?? {};
    const unidadesDisponibles = Number(product.stock ?? product.units ?? 0);

    if (unidadesDisponibles < 1) {
      throw new Error(`${product.nombre ?? 'Un producto'} esta agotado.`);
    }

    return {
      productId,
      codigo: String(product.codigo ?? ''),
      nombre: String(product.nombre ?? ''),
      descripcion: String(product.descripcion ?? ''),
      categoria: String(product.categoria ?? ''),
      imagenUrl: String(product.imagenUrl ?? ''),
      cantidad: Math.min(cantidad, unidadesDisponibles),
      precio: Number(product.precio ?? 0),
      unidadesDisponibles,
    };
  }));
}

export const getCart = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;

  if (!uid) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  const snapshot = await db.collection('carritos').doc(uid).get();
  const productos = snapshot.exists ? snapshot.data()?.productos ?? [] : [];

  return res.json({ success: true, productos });
};

export const saveCart = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user?.uid;
    const requestedItems = normalizeRequestedItems(req.body.productos);

    if (!uid) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    if (!requestedItems) {
      return res.status(400).json({ success: false, message: 'Los productos del carrito no son validos.' });
    }

    const productos = await buildCartItems(requestedItems);

    await db.collection('carritos').doc(uid).set({
      clienteId: uid,
      productos,
      fechaActualizacion: admin.firestore.Timestamp.now(),
    });

    return res.json({ success: true, productos });
  } catch (error) {
    console.error('[SAVE CART]', error);
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'No se pudo guardar el carrito.',
    });
  }
};

export const clearCart = async (req: AuthRequest, res: Response) => {
  const uid = req.user?.uid;

  if (!uid) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  await db.collection('carritos').doc(uid).delete();
  return res.json({ success: true, productos: [] });
};
