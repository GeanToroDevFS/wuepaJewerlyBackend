import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

let serviceAccount: admin.ServiceAccount;

try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
  console.log('✅ Firebase service account cargado');
} catch (error) {
  console.error('❌ Error parseando FIREBASE_SERVICE_ACCOUNT_KEY');
  throw new Error('JSON inválido en FIREBASE_SERVICE_ACCOUNT_KEY');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });

  console.log('🚀 Firebase inicializado');
}

export const auth = admin.auth();
export const db = admin.firestore();
export const storage = admin.storage();
