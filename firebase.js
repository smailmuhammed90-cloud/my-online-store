// firebase.js
// (compat style — make sure you include the Firebase CDN <script> tags in your HTML BEFORE this file)

const firebaseConfig = {
  apiKey: "AIzaSyBjIlddTv_tWkzDAKKlK_1TuK8TTYHbGJ0",
  authDomain: "soul-store-a1075.firebaseapp.com",
  databaseURL: "https://soul-store-a1075-default-rtdb.firebaseio.com",
  projectId: "soul-store-a1075",
  storageBucket: "soul-store-a1075.appspot.com", // changed to .appspot.com (standard)
  messagingSenderId: "849267908668",
  appId: "1:849267908668:web:6c85f9fcfe7b8580e72339",
  measurementId: "G-TEC7DVNR3S"
};

// initialize firebase if not already
if (!window.firebase || !firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
window.auth = firebase.auth();

// set persistence so sign-in survives reload/redirect
if (auth && auth.setPersistence) {
  auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => console.log("✅ Firebase auth persistence set to LOCAL"))
    .catch(err => console.warn("⚠️ Could not set persistence:", err));
}

// ---- ADMIN EMAILS ----
// Replace the value below with the EXACT admin email as shown in Firebase Console -> Authentication -> Users
// Example: ["ggbrochilguy@gmail.com"]
window.ADMIN_EMAILS = [
  "ggbrochilguy@gmail.com" // <<--- put your admin email here exactly once
];

console.log("✅ firebase.js loaded — auth ready:", !!window.auth, "ADMIN_EMAILS:", window.ADMIN_EMAILS);

