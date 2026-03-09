// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBjIlddTv_tWkzDAKKlK_1TuK8TTYHbGJ0",
  authDomain: "soul-store-a1075.firebaseapp.com",
  projectId: "soul-store-a1075",
  storageBucket: "soul-store-a1075.appspot.com",
  messagingSenderId: "849267908668",
  appId: "1:849267908668:web:6c85f9fcfe7b8580e72339",
  measurementId: "G-TEC7DVNR3S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Function to handle Google login
export function loginWithGoogle() {
  return signInWithPopup(auth, provider)
    .then((result) => {
      console.log("User logged in:", result.user);
      alert(`Welcome ${result.user.displayName}`);
    })
    .catch((error) => {
      console.error("Login error:", error);
    });
}
