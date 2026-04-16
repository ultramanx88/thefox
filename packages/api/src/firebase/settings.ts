import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

export const SettingsService = {
  get: async <T>(path: string): Promise<T | null> => {
    const snap = await getDoc(doc(db, 'settings', path));
    return snap.exists() ? (snap.data() as T) : null;
  },

  set: (path: string, data: object) =>
    setDoc(doc(db, 'settings', path), { ...data, updatedAt: serverTimestamp() }, { merge: true }),

  onSnapshot: <T>(path: string, callback: (data: T | null) => void) =>
    onSnapshot(doc(db, 'settings', path), (snap) =>
      callback(snap.exists() ? (snap.data() as T) : null)
    ),
};
