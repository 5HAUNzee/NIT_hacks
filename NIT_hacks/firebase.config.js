import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNzx6UHevXlzbsXqDWTg9tqUbtXCS2BKI",
  authDomain: "nithacks-d81b2.firebaseapp.com",
  projectId: "nithacks-d81b2",
  storageBucket: "nithacks-d81b2.firebasestorage.app",
  messagingSenderId: "88498402823",
  appId: "1:88498402823:web:ea12b13d0a4a7665605ca2",
  measurementId: "G-JDH7BTMK72",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);
