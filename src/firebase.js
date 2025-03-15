// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyCE8FoOOBhkbKD_hrw2idM7vv3ZtQwMYoM",
  authDomain: "medicine-c6ebf.firebaseapp.com",
  projectId: "medicine-c6ebf",
  storageBucket: "medicine-c6ebf.firebasestorage.app",
  messagingSenderId: "381428933752",
  appId: "1:381428933752:web:915fe980c323955cd3f98d",
  measurementId: "G-WG1WS95JZF"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
auth.useDeviceLanguage(); // Ensure language is set

export { auth, RecaptchaVerifier, signInWithPhoneNumber };