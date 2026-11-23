import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBw2BXQ0bubipE0PnTbHBa128zBV8EJPpc",
  authDomain: "bank-teta.firebaseapp.com",
  projectId: "bank-teta",
  storageBucket: "bank-teta.firebasestorage.app",
  messagingSenderId: "185129169349",
  appId: "1:185129169349:web:192fa3c7ba7fbd09ba5bac",
};

export function getDb() {
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  return getFirestore(app);
}
