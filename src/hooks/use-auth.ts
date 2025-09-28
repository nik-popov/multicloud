
'use-client';

import { useContext } from 'react';
import { AuthContext } from '@/components/auth-provider';
import type { User } from 'firebase/auth';

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<any>;
  signUp: (email: string, pass:string) => Promise<any>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
