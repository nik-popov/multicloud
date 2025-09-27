
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth }from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCZQI-bU0XrCsmHT1XGNnbYWw7-Jw6DIpU",
  authDomain: "studio-1789539808-2f8a9.firebaseapp.com",
  projectId: "studio-1789539808-2f8a9",
  storageBucket: "studio-1789539808-2f8a9.firebasestorage.app",
  messagingSenderId: "907565582067",
  appId: "1:907565582067:web:73e99ab1a1fee88419d986"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
