import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "riot-dj-app.firebaseapp.com",
  databaseURL: "https://riot-dj-app-default-rtdb.firebaseio.com",
  projectId: "riot-dj-app",
  storageBucket: "riot-dj-app.firebasestorage.app",
  messagingSenderId: "796492238038",
  appId: "1:796492238038:web:42c3596e4cbd05d39d4d77",
  measurementId: "G-Z2MFWKJQHC"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);