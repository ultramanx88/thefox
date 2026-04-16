import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as _onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './config';

export type { User };
export type UserRole = 'customer' | 'vendor' | 'driver' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
}

export const FirebaseAuthService = {
  signUp: async (email: string, password: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    return credential;
  },

  signIn: (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password),

  signOut: () => signOut(auth),

  getCurrentUser: (): User => {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    return user;
  },

  onAuthStateChanged: (callback: (user: User | null) => void) =>
    _onAuthStateChanged(auth, callback),
};
