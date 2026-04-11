/**

* Main server entrypoint for the Wuepa Backend.
*
* This module:
* * Loads environment variables via dotenv.
* * Initializes Express app.
* * Applies global middleware (CORS, JSON parser).
* * Mounts API routes under /api.
* * Provides health and debug endpoints.
* * Handles global errors.
* * Starts the HTTP server.
    */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { corsMiddleware } from './middlewares/corsMiddleware';

// 🔥 Importa Firebase para forzar inicialización
import './config/firebase';

// 👉 Importa rutas (irás agregando más)
import authRoutes from './routes/authRoutes';
// import userRoutes from './routes/userRoutes';
// import paymentRoutes from './routes/paymentRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

/**

* ========================
* GLOBAL MIDDLEWARE
* ========================
  */
  app.use(corsMiddleware);
  app.use(express.json());

/**

* ========================
* ROUTES
* ========================
  */
  app.use('/api/auth', authRoutes);

// futuras rutas
// app.use('/api/users', userRoutes);
// app.use('/api/payments', paymentRoutes);

/**

* ========================
* HEALTH CHECK
* ========================
  */
  app.get('/', (req, res) => {
  console.log('🚀 [HEALTH] Wuepa backend activo');
  res.send('🚀 Wuepa Backend funcionando correctamente');
  });

/**

* ========================
* DEBUG ENDPOINT
* ========================
  */
  app.get('/debug', (req, res) => {
  console.log('🔍 [DEBUG] Verificando configuración');

res.json({
environment: process.env.NODE_ENV || 'development',
firebase: process.env.FIREBASE_PROJECT_ID ? '✅ Conectado' : '❌ No configurado',
wompi: process.env.WOMPI_PUBLIC_KEY ? '✅ Configurado' : '❌ No configurado',
instagram: process.env.INSTAGRAM_TOKEN ? '✅ Configurado' : '❌ No configurado',
port: PORT
});
});

/**

* ========================
* GLOBAL ERROR HANDLER
* ========================
  */
  app.use((
  err: any,
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
  ) => {
  console.error('💥 [ERROR GLOBAL]:', err.message);

res.status(500).json({
success: false,
message: 'Error interno del servidor',
});
});

/**

* ========================
* SERVER START
* ========================
  */
  app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🌐 WUEPA BACKEND RUNNING`);
  console.log(`🚀 Puerto: ${PORT}`);
  console.log(`🔍 Debug: http://localhost:${PORT}/debug`);
  console.log('=================================');
  });
