
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT as string
);

const app = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount),
      storageBucket: "studio-7015657083-f6ef1.appspot.com",
    })
  : getApp();

const storage = getStorage(app);

export { app, storage };
