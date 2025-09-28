
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
};

const app = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount),
      storageBucket: "studio-7015657083-f6ef1.appspot.com",
    })
  : getApp();

const storage = getStorage(app);

export { app, storage };
