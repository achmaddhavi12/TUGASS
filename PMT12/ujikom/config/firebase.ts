// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC0AV5pz-zTj0slnUrQUWJcQM9kyRggXnc",
  authDomain: "ujikom-91c8e.firebaseapp.com",
  projectId: "ujikom-91c8e",
  storageBucket: "ujikom-91c8e.firebasestorage.app",
  messagingSenderId: "535623450147",
  appId: "1:535623450147:web:9d47fa733646f10dadbb96",
  measurementId: "G-NQY3LPLYWH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;