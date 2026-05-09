import { Request, Response } from 'express';

import { db } from '../config/firebase';

import {
  getInstagramPosts
} from '../services/instagramService';

import {
  parseInstagramCaption
} from '../utils/instagramProductParser';

export const syncInstagramProducts =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const posts =
        await getInstagramPosts();

      let created = 0;

      for (const post of posts) {

        if (!post.caption) {
          continue;
        }

        const parsed =
          parseInstagramCaption(
            post.caption
          );

        const existing =
          await db.collection('productos')
            .where('instagramPostId', '==', post.id)
            .get();

        if (!existing.empty) {
          continue;
        }

        await db.collection('productos')
          .add({
            nombre: parsed.nombre,
            descripcion: parsed.descripcion,
            precio: parsed.precio,
            stock: parsed.stock,
            categoria: parsed.categoria,
            codigo: parsed.codigo,
            imagenUrl: post.media_url,
            instagramPostId: post.id,
            createdAt: new Date(),
          });

        created++;
      }

      return res.json({
        success: true,
        imported: created,
      });

    } catch (error) {

      console.error(error);

      return res.status(500).json({
        success: false,
        message:
          'Error sincronizando Instagram',
      });
    }
  };