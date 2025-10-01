// index.js

// Import Firebase auth
import { auth, googleProvider } from "./src/firebase.js";
import { signInWithPopup } from "firebase/auth";

// Import Supabase
import { supabase } from "./src/supabase.js";

// Example: Google Login
async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("✅ User logged in:", result.user);
    alert("Welcome " + result.user.displayName);
  } catch (error) {
    console.error("❌ Error logging in:", error);
  }
}

// Example: Supabase Query
async function loadProducts() {
  let { data, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("❌ Error fetching products:", error);
  } else {
    console.log("🛍 Products:", data);
  }
}

// Attach Google login to button
document.getElementById("googleLogin").addEventListener("click", loginWithGoogle);

// Run demo functions
loadProducts();   // only auto-load products, not login
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("loginPageBtn").style.display = "none";
    document.getElementById("signupPageBtn").style.display = "none";
    document.getElementById("profileIcon").style.display = "inline-block";
    document.getElementById("logoutBtn").style.display = "inline-block";

    if (ADMIN_EMAILS.includes(user.email)) {
      document.getElementById("adminLink").style.display = "inline-block";
    }
  } else {
    document.getElementById("loginPageBtn").style.display = "inline-block";
    document.getElementById("signupPageBtn").style.display = "inline-block";
    document.getElementById("profileIcon").style.display = "none";
    document.getElementById("logoutBtn").style.display = "none";
    document.getElementById("adminLink").style.display = "none";
  }
});
document.getElementById("signupPageBtn").addEventListener("click", () => {
  window.location.href = "signup.html";
});
