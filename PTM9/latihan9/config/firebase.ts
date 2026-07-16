// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC4Lhs8aJ37z0edvH4mPv-xFj6X4aMBw5k",
  authDomain: "dbrestoran-e1550.firebaseapp.com",
  projectId: "dbrestoran-e1550",
  storageBucket: "dbrestoran-e1550.firebasestorage.app",
  messagingSenderId: "135023805548",
  appId: "1:135023805548:web:84c0262a69f10e30d38449",
  measurementId: "G-2HQ4BJEGM7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);