
'use client';

import { createContext, useEffect, useState, ReactNode } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import type { AuthContextType } from '@/hooks/use-auth';
import { SessionProvider } from 'next-auth/react';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  const signOut = () => {
    return firebaseSignOut(auth);
  };
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth, 
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        console.error("Authentication error, signing out:", error);
        setUser(null);
        setLoading(false);
        signOut();
      }
    );
    return () => unsubscribe();
  }, [auth]);

  const signIn = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.readonly');
    return signInWithPopup(auth, provider);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return (
    <SessionProvider>
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    </SessionProvider>
  );
}
