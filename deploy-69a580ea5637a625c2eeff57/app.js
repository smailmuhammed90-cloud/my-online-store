// app.js (type=module)
const t = {
  kk:{ title:"Әйелдер киімі дүкені", cart:"Себет", total:"Жалпы", addToCart:"Себетке қосу", login:"Google арқылы кіру", logout:"Шығу", all:"Барлығы" },
  ru:{ title:"Магазин женской одежды", cart:"Корзина", total:"Итого", addToCart:"В корзину", login:"Войти через Google", logout:"Выйти", all:"Все" }
};
let lang = "kk";

const siteTitle = document.getElementById("site-title");
const langSelect = document.getElementById("language-switcher");
const searchInput = document.getElementById("search");
const categoryFilter = document.getElementById("categoryFilter");
const productsEl = document.getElementById("products");

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminLink = document.getElementById("adminLink");

const cartIcon = document.getElementById("cart-icon");
const cartSidebar = document.getElementById("cart");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartCount = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkout");
const cartTitle = document.getElementById("cartTitle");

let products = [];
let cart = [];

// Auth UI
auth.onAuthStateChanged(user => {
  if(user){
    loginBtn.style.display="none";
    logoutBtn.style.display="inline-block";
    if (window.ADMIN_EMAILS.includes(user.email)) adminLink.style.display="inline-block";
    else adminLink.style.display="none";
  } else {
    loginBtn.style.display="inline-block";
    logoutBtn.style.display="none";
    adminLink.style.display="none";
  }
});

loginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  await auth.signInWithPopup(provider);
});
logoutBtn.addEventListener("click", ()=>auth.signOut());

// Load categories & products from Supabase
async function loadCategories(){
  const { data, error } = await window.supabase.from('categories').select('*').order('name', {ascending:true});
  categoryFilter.innerHTML = `<option value="">${t[lang].all}</option>`;
  if(data) data.forEach(c=> {
    const opt = document.createElement('option'); opt.value = c.id; opt.textContent = c.name;
    categoryFilter.appendChild(opt);
  });
}
async function loadProducts(){
  const { data, error } = await window.supabase.from('products').select('*').order('created_at', {ascending:false});
  products = data || [];
  renderProducts();
}

function renderProducts(){
  const q = (searchInput.value || "").toLowerCase().trim();
  const cat = categoryFilter.value;
  productsEl.innerHTML="";
  products.filter(p=>{
    const name = (lang==="kk"?p.name_kk:p.name_ru) || "";
    const matchesQ = !q || name.toLowerCase().includes(q);
    const matchesCat = !cat || String(p.category) === String(cat);
    return matchesQ && matchesCat;
  }).forEach(p=>{
    const div = document.createElement('div'); div.className='product';
    div.innerHTML = `
      <img src="${p.image_url}" alt="">
      <div class="name">${lang==="kk"?p.name_kk:p.name_ru}</div>
      <div class="price">${(p.price||0).toLocaleString()} ₸</div>
      <button class="add" data-id="${p.id}">${t[lang].addToCart}</button>
    `;
    productsEl.appendChild(div);
  });
  document.querySelectorAll('.add').forEach(btn=> btn.addEventListener('click', ()=>{
    const id=btn.dataset.id; const p = products.find(x=>String(x.id)===String(id));
    if(!p) return;
    cart.push({ id:p.id, name: (lang==="kk"?p.name_kk:p.name_ru), price:p.price });
    updateCart();
  }));
}

function updateCart(){
  cartItems.innerHTML=""; let total=0;
  cart.forEach(it=>{ total+=it.price; const li=document.createElement('li'); li.textContent=`${it.name} — ${it.price} ₸`; cartItems.appendChild(li); });
  cartTotal.textContent = `${t[lang].total}: ${total.toLocaleString()} ₸`;
  cartCount.textContent = cart.length;
}

cartIcon.addEventListener('click', ()=> cartSidebar.classList.toggle('show'));
searchInput.addEventListener('input', renderProducts);
categoryFilter.addEventListener('change', renderProducts);

langSelect.addEventListener('change', (e)=>{ lang=e.target.value; applyLang(); });
function applyLang(){
  siteTitle.textContent = t[lang].title;
  cartTitle.textContent = `🛒 ${t[lang].cart}`;
  checkoutBtn.textContent = t[lang].total;
  loadCategories(); renderProducts();
}

// initial load
applyLang();
loadCategories();
loadProducts();
// Email login
async function loginWithEmail() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    console.log("✅ Logged in:", result.user.email);
    alert("Welcome " + result.user.email);

    // Hide/show buttons
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("logoutBtn").style.display = "inline-block";

    if (ADMIN_EMAILS.includes(result.user.email)) {
      document.getElementById("adminLink").style.display = "inline-block";
    }

  } catch (error) {
    console.error("❌ Email login error:", error);
    alert("Login failed: " + error.message);
  }
}

// Email signup
async function signupWithEmail() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    console.log("✅ Signed up:", result.user.email);
    alert("Account created for " + result.user.email);
  } catch (error) {
    console.error("❌ Signup error:", error);
    alert("Signup failed: " + error.message);
  }
}

// Attach events
document.getElementById("emailLoginBtn").addEventListener("click", loginWithEmail);
document.getElementById("signupBtn").addEventListener("click", signupWithEmail);
import { supabase } from "./supabase-init.js";

async function loadProducts() {
  let { data, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("❌ Supabase error:", error.message);
  } else {
    console.log("✅ Products:", data);
  }
}

loadProducts();
import { supabase } from "./supabase-init.js";

// Тауарларды шығару
async function loadProducts() {
  const { data, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("❌ Supabase error:", error.message);
    return;
  }

  const grid = document.querySelector(".products-grid");
  grid.innerHTML = ""; // тазалау

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${item.img}" alt="${item.name}" />
      <h3>${item.name}</h3>
      <p>${item.description || ""}</p>
      <div class="price">${item.price} ₸</div>
      <button class="add-to-cart" 
        data-name="${item.name}" 
        data-price="${item.price}" 
        data-img="${item.img}">
        🛒 Себетке қосу
      </button>
    `;
    grid.appendChild(card);
  });
}

loadProducts();
import { supabase } from "./supabase-init.js";

async function loadProducts() {
  const { data, error } = await supabase.from("products").select("*");
  if (error) {
    console.error("❌ Supabase error:", error.message);
    return;
  }

  const grid = document.querySelector(".products-grid");
  grid.innerHTML = "";

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${item.img}" alt="${item.name}" style="width:100%;height:250px;object-fit:cover;" />
      <h3>${item.name}</h3>
      <p>${item.description || ""}</p>
      <div class="price">${item.price} ₸</div>
      <button class="add-to-cart"
        data-name="${item.name}"
        data-price="${item.price}"
        data-img="${item.img}">
        🛒 Себетке қосу
      </button>
    `;
    grid.appendChild(card);
  });
}

loadProducts();
// app.js
import { supabase } from "./supabase-init.js";   // relative path must be correct

console.log("app.js sees supabase:", supabase, "typeof from:", typeof supabase.from);

// simple test call
(async () => {
  try {
    const { data, error } = await supabase.from("products").select("*").limit(1);
    if (error) console.error("supabase query error:", error);
    else console.log("sample product row:", data);
  } catch (e) {
    console.error("unexpected error calling supabase:", e);
  }
})();
