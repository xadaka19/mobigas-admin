import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyBUCqwSG6xvRWjRFFgvEitdbCLCKn6ovbU",
  authDomain: "mobigas-prod.firebaseapp.com",
  projectId: "mobigas-prod",
  storageBucket: "mobigas-prod.firebasestorage.app",
  messagingSenderId: "370382275180",
  appId: "1:370382275180:web:ed6fbe400d01f64c230e49"
};

const app = initializeApp(firebaseConfig);

// App Check — protects against unauthorized API/Firestore access
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LffTj0tAAAAAD0RL4nGH12K496PEvTqaT2NvDX-'),
  isTokenAutoRefreshEnabled: true,
});

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
