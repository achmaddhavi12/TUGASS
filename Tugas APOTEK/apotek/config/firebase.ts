import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFofYNzObWBVrScaiBvJDJw78X1a01jaQ",
  authDomain: "dbapotek-e14d7.firebaseapp.com",
  projectId: "dbapotek-e14d7",
  storageBucket: "dbapotek-e14d7.firebasestorage.app",
  messagingSenderId: "1032446604190",
  appId: "1:1032446604190:web:80f128e26bf42bb4651c8f",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);