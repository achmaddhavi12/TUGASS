// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDpzOMfvlza3ug04PKSISiTKtYA_YndniA",
  authDomain: "bioskop-64976.firebaseapp.com",
  projectId: "bioskop-64976",
  storageBucket: "bioskop-64976.firebasestorage.app",
  messagingSenderId: "377107089909",
  appId: "1:377107089909:web:d2e90c7611916a10b3b8bc",
  measurementId: "G-CC1MBHPWMM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);