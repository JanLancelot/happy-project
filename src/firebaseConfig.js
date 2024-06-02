// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCq_Wf4ElXvWWIDbdpUWAj6NUeK59PBORE",
  authDomain: "happy-project-c9185.firebaseapp.com",
  projectId: "happy-project-c9185",
  storageBucket: "happy-project-c9185.appspot.com",
  messagingSenderId: "675125926535",
  appId: "1:675125926535:web:4b373842304a3de1443622"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);