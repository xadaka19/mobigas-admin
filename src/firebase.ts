import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBUCqwSG6xvRWjRFFgvEitdbCLCKn6ovbU",
  authDomain: "mobigas-prod.firebaseapp.com",
  projectId: "mobigas-prod",
  storageBucket: "mobigas-prod.firebasestorage.app",
  messagingSenderId: "370382275180",
  appId: "1:370382275180:web:ed6fbe400d01f64c230e49"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
