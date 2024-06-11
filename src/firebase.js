// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDRjX1qTrLYM3n3xASSDC3DO1y_0KCLIUI",
  authDomain: "nullclass-project1.firebaseapp.com",
  projectId: "nullclass-project1",
  storageBucket: "nullclass-project1",
  messagingSenderId: "864755743631",
  appId: "1:864755743631:web:b508da7c75ca0f2b05a9fa",
  measurementId: "G-GYR3ND9X4X"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };






