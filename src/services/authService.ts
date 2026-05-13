import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

export const AuthService = {
  async signInWithGoogle(): Promise<UserProfile | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Get or create user profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
         const newProfile: UserProfile = {
           uid: user.uid,
           displayName: user.displayName,
           email: user.email,
           photoURL: user.photoURL,
           role: 'customer',
           createdAt: new Date().toISOString()
         };
         await setDoc(doc(db, 'users', user.uid), {
           ...newProfile,
           serverCreatedAt: serverTimestamp()
         });
         return newProfile;
      }
      
      return userDoc.data() as UserProfile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'users');
      return null;
    }
  },

  async signOut() {
    return firebaseSignOut(auth);
  },

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};
