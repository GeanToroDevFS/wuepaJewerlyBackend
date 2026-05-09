import { Request, Response } from 'express';

import {
  publishProductToInstagram
} from '../services/instagramService';

export const publishInstagramPost = async (
  req: Request,
  res: Response
) => {

  try {

    const {
      imageUrl,
      caption
    } = req.body;

    if (!imageUrl || !caption) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    const result =
      await publishProductToInstagram(
        imageUrl,
        caption
      );

    return res.json({
      success: true,
      result
    });

  } catch (error) {

    console.error(
      '❌ [INSTAGRAM CONTROLLER]',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Error publicando en Instagram'
    });
  }
};