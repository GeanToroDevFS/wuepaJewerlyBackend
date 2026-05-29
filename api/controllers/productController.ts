import { Request, Response } from 'express';
import { db, storage } from '../config/firebase';

type StorageFileReference = {
  bucketName: string;
  filePath: string;
};

function getStorageFileReferenceFromUrl(imageUrl: unknown): StorageFileReference | null {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return null;
  }

  const normalizedUrl = imageUrl.trim();

  if (normalizedUrl.startsWith('gs://')) {
    const withoutProtocol = normalizedUrl.replace('gs://', '');
    const [bucketName, ...pathParts] = withoutProtocol.split('/');
    const filePath = pathParts.join('/');

    return bucketName && filePath ? { bucketName, filePath } : null;
  }

  try {
    const url = new URL(normalizedUrl);

    if (url.hostname === 'firebasestorage.googleapis.com') {
      const match = url.pathname.match(/^\/v0\/b\/([^/]+)\/o\/(.+)$/);

      if (!match) {
        return null;
      }

      return {
        bucketName: decodeURIComponent(match[1]),
        filePath: decodeURIComponent(match[2]),
      };
    }

    if (url.hostname === 'storage.googleapis.com') {
      const [, bucketName, ...pathParts] = url.pathname.split('/');
      const filePath = pathParts.join('/');

      return bucketName && filePath ? { bucketName, filePath: decodeURIComponent(filePath) } : null;
    }
  } catch {
    return null;
  }

  return null;
}

async function deleteProductImageFromStorage(imageUrl: unknown) {
  const fileReference = getStorageFileReferenceFromUrl(imageUrl);

  if (!fileReference) {
    return;
  }

  await storage
    .bucket(fileReference.bucketName)
    .file(fileReference.filePath)
    .delete({ ignoreNotFound: true });
}

/**
 * ✅ Crear producto (ADMIN)
 */
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      categoria,
      imagenUrl,
      codigo,
      stock
    } = req.body;

    if (!nombre || precio === undefined || !categoria) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio y categoría son obligatorios'
      });
    }

    if (Number(precio) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Precio inválido'
      });
    }

    if (Number(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock inválido'
      });
    }

    const docRef = await db.collection('productos').add({
      nombre,
      descripcion: descripcion || '',
      precio: Number(precio),
      categoria,
      imagenUrl: imagenUrl || '',
      codigo: codigo || '',
      stock: Number(stock) || 0
    });

    return res.status(201).json({
      success: true,
      id: docRef.id
    });

  } catch (error) {
    console.error('❌ [CREATE PRODUCT]', error);

    return res.status(500).json({
      success: false,
      message: 'Error creando producto'
    });
  }
};

/**
 * ✅ Obtener productos (PÚBLICO)
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('productos').get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return res.json(products);

  } catch (error) {
    console.error('❌ [GET PRODUCTS]', error);

    return res.status(500).json({
      success: false,
      message: 'Error obteniendo productos'
    });
  }
};

/**
 * ✅ Actualizar producto (ADMIN)
 */
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID requerido'
      });
    }

    const {
      nombre,
      descripcion,
      precio,
      categoria,
      imagenUrl,
      codigo,
      stock
    } = req.body;

    await db.collection('productos')
      .doc(id)
      .update({
        nombre,
        descripcion,
        precio: Number(precio),
        categoria,
        imagenUrl,
        codigo,
        stock: Number(stock)
      });

    return res.json({
      success: true,
      message: 'Producto actualizado'
    });

  } catch (error) {
    console.error('❌ [UPDATE PRODUCT]', error);

    return res.status(500).json({
      success: false,
      message: 'Error actualizando producto'
    });
  }
};

/**
 * ✅ Eliminar producto (ADMIN)
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID requerido'
      });
    }

    const productRef = db.collection('productos').doc(id);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const productData = productDoc.data();

    await deleteProductImageFromStorage(productData?.imagenUrl);
    await productRef.delete();

    return res.json({
      success: true,
      message: 'Producto eliminado'
    });

  } catch (error) {
    console.error('❌ [DELETE PRODUCT]', error);

    return res.status(500).json({
      success: false,
      message: 'Error eliminando producto'
    });
  }
};
