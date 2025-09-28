
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAFQv9JXIt9x-ni1ggP7j7uJRAzIKLm1hs",
  authDomain: "studio-7015657083-f6ef1.firebaseapp.com",
  projectId: "studio-7015657083-f6ef1",
  storageBucket: "studio-7015657083-f6ef1.appspot.com",
  messagingSenderId: "592726576875",
  appId: "1:592726576875:web:4c323c6ee848d7a10378ae"
};


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
