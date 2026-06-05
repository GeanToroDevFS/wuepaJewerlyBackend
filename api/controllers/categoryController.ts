import { Request, Response } from 'express';
import { db } from '../config/firebase';

const DEFAULT_CATEGORIES = [
  { id: 'collares', name: 'Collares' },
  { id: 'aretes', name: 'Aretes' },
  { id: 'pulseras', name: 'Pulseras' },
  { id: 'anillos', name: 'Anillos' },
  { id: 'paquetes', name: 'Paquetes' },
];

function normalizeCategoryId(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureDefaultCategories() {
  const collection = db.collection('categorias');
  const setupRef = db.collection('configuracion').doc('categorias');
  const setupDoc = await setupRef.get();

  if (setupDoc.exists) {
    return;
  }

  const batch = db.batch();
  DEFAULT_CATEGORIES.forEach((category, index) => {
    batch.set(collection.doc(category.id), {
      nombre: category.name,
      orden: index,
      fechaCreacion: new Date(),
    });
  });
  batch.set(setupRef, { inicializadas: true, fechaInicializacion: new Date() });
  await batch.commit();
}

export const getCategories = async (_req: Request, res: Response) => {
  try {
    await ensureDefaultCategories();
    const snapshot = await db.collection('categorias').orderBy('orden', 'asc').get();
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      nombre: doc.data().nombre,
    }));

    return res.json(categories);
  } catch (error) {
    console.error('[GET CATEGORIES]', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo categorias' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const name = typeof req.body.nombre === 'string' ? req.body.nombre.trim() : '';
    const id = normalizeCategoryId(name);

    if (!name || !id) {
      return res.status(400).json({ success: false, message: 'El nombre de la categoria es obligatorio' });
    }

    const categoryRef = db.collection('categorias').doc(id);
    const categoryDoc = await categoryRef.get();

    if (categoryDoc.exists) {
      return res.status(409).json({ success: false, message: 'Esta categoria ya existe' });
    }

    await categoryRef.set({
      nombre: name,
      orden: Date.now(),
      fechaCreacion: new Date(),
    });

    return res.status(201).json({ success: true, category: { id, nombre: name } });
  } catch (error) {
    console.error('[CREATE CATEGORY]', error);
    return res.status(500).json({ success: false, message: 'Error creando categoria' });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const categoryRef = db.collection('categorias').doc(id);
    const categoryDoc = await categoryRef.get();

    if (!categoryDoc.exists) {
      return res.status(404).json({ success: false, message: 'Categoria no encontrada' });
    }

    const productsSnapshot = await db.collection('productos').where('categoria', '==', id).limit(1).get();

    if (!productsSnapshot.empty) {
      return res.status(409).json({
        success: false,
        message: 'No puedes borrar una categoria que todavia tiene productos',
      });
    }

    const categoriesSnapshot = await db.collection('categorias').limit(2).get();

    if (categoriesSnapshot.size <= 1) {
      return res.status(409).json({
        success: false,
        message: 'Debe existir al menos una categoria',
      });
    }

    await categoryRef.delete();
    return res.json({ success: true, message: 'Categoria eliminada' });
  } catch (error) {
    console.error('[DELETE CATEGORY]', error);
    return res.status(500).json({ success: false, message: 'Error eliminando categoria' });
  }
};
