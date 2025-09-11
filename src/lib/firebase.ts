// Import the functions you need from the SDKs you need
import { initializeApp }from 'firebase/app';
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-194970231-e2328",
  "appId": "1:267081487256:web:bcc84fd82670c0181191ed",
  "storageBucket": "studio-194970231-e2328.firebasestorage.app",
  "apiKey": "AIzaSyCQR1gpcwvXIVTCMFw3y5E9ONPEAUB00js",
  "authDomain": "studio-194970231-e2328.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "267081487256"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
