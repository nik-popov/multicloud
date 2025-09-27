
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth }from 'firebase/auth';

const firebaseConfig = {
  projectId: "studio-1789539808-2f8a9",
  apiKey: "AIzaSyCZQI-bU0XrCsmHT1XGNnbYWw7-Jw6DIpU",
  authDomain: "studio-1789539808-2f8a9.firebaseapp.com",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
