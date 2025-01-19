import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';


const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initializing Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);


export const googleProvider = new GoogleAuthProvider();


googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
googleProvider.addScope('openid');
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Configure OAuth 2.0 access
googleProvider.setCustomParameters({
    access_type: 'offline',
    prompt: 'consent select_account'
}); 
