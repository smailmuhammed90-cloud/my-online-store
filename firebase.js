// firebase.js — shared Firebase Auth initialization
// Include Firebase CDN scripts BEFORE this file in your HTML

var firebaseConfig = {
  apiKey: "AIzaSyBjIlddTv_tWkzDAKKlK_1TuK8TTYHbGJ0",
  authDomain: "soul-store-a1075.firebaseapp.com",
  projectId: "soul-store-a1075",
  storageBucket: "soul-store-a1075.appspot.com",
  messagingSenderId: "849267908668",
  appId: "1:849267908668:web:6c85f9fcfe7b8580e72339",
  measurementId: "G-TEC7DVNR3S"
};

if (typeof firebase !== 'undefined') {
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  window.auth = firebase.auth();

  // Persist login across page reloads
  if (auth && auth.setPersistence) {
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function() {});
  }
} else {
  console.warn("Firebase SDK not loaded");
}

// Admin email(s) — must match Firebase Authentication users exactly
window.ADMIN_EMAILS = [
  "ggbrochilguy@gmail.com"
];
