const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}
const SUPABASE_URL =
  "https://uqgckzrmibdgxkxdfzav.supabase.co";
const SUPABASE_KEY =
  "sb_publishable_KBodwmECQvN46zDKjOwfhg_fet6nBiy";
const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};
let currentShop = null;
let menuItems = [];
let cart = [];
let currentCat = "Barchasi";
/* =========================
   SHOP KODINI ANIQLASH
   ========================= */
function getShopCode() {
  // Telegram Mini App startapp
  if (tg?.initDataUnsafe?.start_param) {
    const param =
      tg.initDataUnsafe.start_param
        .trim()
        .toUpperCase();
    if (param) {
      return param;
    }
  }
  // Oddiy QR/link:
  // ?shop=B001
  const params =
    new URLSearchParams(location.search);
  const shop =
    params.get("shop");
  if (shop) {
    return shop.trim().toUpperCase();
  }
  // Telegram startapp
  const startApp =
    params.get("startapp");
  if (startApp) {
    return startApp.trim().toUpperCase();
  }
  // Telegram start_param
  const startParam =
    params.get("start_param");
  if (startParam) {
    return startParam.trim().toUpperCase();
  }
  // Faqat test uchun
  return "B001";
}
const shopCode =
  getShopCode();
console.log(
  "Aniqlangan do‘kon:",
  shopCode
);
/* =========================
   DO‘KONNI YUKLASH
   ========================= */
async function loadShop() {
  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/shops` +
      `?shop_code=eq.${encodeURIComponent(shopCode)}` +
      `&is_active=eq.true` +
      `&select=*`,
      {
        headers
      }
    );
  if (!response.ok) {
    throw new Error(
      "Do‘konni yuklashda xatolik"
    );
  }
  const shops =
    await response.json();
  if (!shops.length) {
    throw new Error(
      `${shopCode} do‘koni topilmadi`
    );
  }
  currentShop =
    shops[0];
  console.log(
    "Yuklangan do‘kon:",
    currentShop
  );
  /*
    Do‘kon nomi
  */
  document.getElementById(
    "shopName"
  ).textContent =
    currentShop.display_name ||
    currentShop.market_name ||
    "Do‘kon";
  /*
    Do‘kon manzili
    Avval address ishlatiladi.
    Agar address bo‘lmasa,
    eski ustunlardan yig‘iladi.
  */
  const address =
    currentShop.address ||
    [
      currentShop.market_name,
      currentShop.row_name,
      currentShop.shop_number
        ? "Do‘kon " + currentShop.shop_number
        : ""
    ]
      .filter(Boolean)
      .join(", ");
  document.getElementById(
    "shopLocation"
  ).textContent =
    address || "Manzil mavjud emas";
  /*
    Shop kodi
  */
  document.getElementById(
    "shopId"
  ).textContent =
    currentShop.shop_code;
}
/* =========================
   MENYUNI YUKLASH
   ========================= */
async function loadMenu() {
  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/menu_items` +
      `?shop_code=eq.${encodeURIComponent(shopCode)}` +
      `&is_available=eq.true` +
      `&select=*` +
      `&order=id.asc`,
      {
        headers
      }
    );
  if (!response.ok) {
    throw new Error(
      "Menyu yuklanmadi"
    );
  }
  menuItems =
    await response.json();
  renderCategories();
  renderMenu();
}
/* =========================
   KATEGORIYALAR
   ========================= */
function renderCategories() {
  const categoriesEl =
    document.getElementById(
      "categories"
    );
  const categories = [
    "Barchasi",
    ...new Set(
      menuItems
        .map(item => item.category)
        .filter(Boolean)
    )
  ];
  categoriesEl.innerHTML = "";
  categories.forEach(category => {
    const button =
      document.createElement("button");
    button.className =
      "cat" +
      (
        category === currentCat
          ? " active"
          : ""
      );
    button.textContent =
      category;
    button.onclick = () => {
      currentCat =
        category;
      [
        ...categoriesEl.children
      ].forEach(x =>
        x.classList.remove(
          "active"
        )
      );
      button.classList.add(
        "active"
      );
      renderMenu();
    };
    categoriesEl.appendChild(
      button
    );
  });
}
/* =========================
   PUL FORMAT
   ========================= */
function money(number) {
  return (
    Number(number)
      .toLocaleString("uz-UZ") +
    " so'm"
  );
}
/* =========================
   MENYUNI CHIQARISH
   ========================= */
function renderMenu() {
  const search =
    document
      .getElementById(
        "searchInput"
      )
      .value
      .toLowerCase()
      .trim();
  const filtered =
    menuItems.filter(item => {
      const categoryOk =
        currentCat === "Barchasi" ||
        item.category === currentCat;
      const text =
        `${item.name} ${item.category || ""}`
          .toLowerCase();
      return (
        categoryOk &&
        text.includes(search)
      );
    });
  document.getElementById(
    "menu"
  ).innerHTML =
    filtered
      .map(item => {
        const inCart =
          cart.find(
            x => x.id === item.id
          );
        const quantity =
          inCart
            ? inCart.qty
            : 0;
        return `
          <div class="item">
            <div class="emoji">
              🍽️
            </div>
            <div class="info">
              <h3>
                ${item.name}
              </h3>
              <p>
                ${item.category || ""}
              </p>
              <div class="price">
                ${money(item.price)}
              </div>
              <small>
                Qoldiq: ${item.stock}
              </small>
            </div>
            <button
              class="add"
              onclick="addToCart(${item.id})"
              ${item.stock <= quantity
                ? "disabled"
                : ""}
            >
              ${
                quantity > 0
                  ? quantity
                  : "+"
              }
            </button>
          </div>
        `;
      })
      .join("");
}
/* =========================
   SEARCH
   ========================= */
document.getElementById(
  "searchInput"
).oninput =
  renderMenu;
/* =========================
   SAVATGA QO‘SHISH
   ========================= */
window.addToCart =
function(id) {
  const item =
    menuItems.find(
      x => x.id === id
    );
  if (!item) return;
  const existing =
    cart.find(
      x => x.id === id
    );
  const currentQty =
    existing
      ? existing.qty
      : 0;
  if (
    currentQty >=
    item.stock
  ) {
    alert(
      "Bu mahsulotning qoldig‘i yetarli emas."
    );
    return;
  }
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      ...item,
      qty: 1
    });
  }
  updateCart();
  renderMenu();
  tg?.HapticFeedback
    ?.impactOccurred("light");
};
/* =========================
   MIQDOR O‘ZGARTIRISH
   ========================= */
window.changeQty =
function(
  id,
  difference
) {
  const item =
    cart.find(
      x => x.id === id
    );
  if (!item) return;
  if (
    difference > 0 &&
    item.qty >= item.stock
  ) {
    alert(
      "Bu mahsulotning qoldig‘i yetarli emas."
    );
    return;
  }
  item.qty +=
    difference;
  if (item.qty <= 0) {
    cart =
      cart.filter(
        x => x.id !== id
      );
  }
  updateCart();
  renderMenu();
};
/* =========================
   SAVATNI YANGILASH
   ========================= */
function updateCart() {
  const count =
    cart.reduce(
      (sum, item) =>
        sum + item.qty,
      0
    );
  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.qty *
        Number(item.price),
      0
    );
  document.getElementById(
    "cartCount"
  ).textContent =
    count;
  document.getElementById(
    "cartTotal"
  ).textContent =
    money(total);
  document.getElementById(
    "checkoutTotal"
  ).textContent =
    money(total);
  document.getElementById(
    "cartButton"
  )
    .classList
    .toggle(
      "hidden",
      count === 0
    );
  document.getElementById(
    "cartItems"
  ).innerHTML =
    cart
      .map(item => `
        <div class="cart-row">
          <div class="grow">
            <strong>
              ${item.name}
            </strong>
            <br>
            <small>
              ${money(item.price)}
            </small>
          </div>
          <div class="qty">
            <button
              onclick="changeQty(
                ${item.id},
                -1
              )"
            >
              −
            </button>
            <strong>
              ${item.qty}
            </strong>
            <button
              onclick="changeQty(
                ${item.id},
                1
              )"
            >
              +
            </button>
          </div>
        </div>
      `)
      .join("");
}
/* =========================
   SAVAT OYNASI
   ========================= */
document.getElementById(
  "cartButton"
).onclick = () => {
  document
    .getElementById(
      "cartModal"
    )
    .classList
    .remove("hidden");
};
/* =========================
   SAVATNI YOPISH
   ========================= */
document.getElementById(
  "closeCart"
).onclick = () => {
  document
    .getElementById(
      "cartModal"
    )
    .classList
    .add("hidden");
};
/* =========================
   SUCCESS OYNASINI YOPISH
   ========================= */
document.getElementById(
  "doneButton"
).onclick = () => {
  document
    .getElementById(
      "successModal"
    )
    .classList
    .add("hidden");
};
/* =========================
   BUYURTMA YUBORISH
   ========================= */
document.getElementById(
  "orderButton"
).onclick =
async () => {
  if (!cart.length) {
    alert(
      "Savat bo‘sh."
    );
    return;
  }
  const phone =
    document
      .getElementById(
        "phone"
      )
      .value
      .trim();
  if (!phone) {
    alert(
      "Telefon raqamingizni kiriting."
    );
    document
      .getElementById(
        "phone"
      )
      .focus();
    return;
  }
  if (!currentShop) {
    alert(
      "Do‘kon ma’lumotlari topilmadi."
    );
    return;
  }
  /*
    TOTAL
  */
  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.qty *
        Number(item.price),
      0
    );
  /*
    MIJOZ ISMI
  */
  const customerName =
    tg?.initDataUnsafe?.user?.first_name ||
    "";
  /*
    IZOH
  */
  const note =
    document
      .getElementById(
        "note"
      )
      .value
      .trim();
  /*
    DO‘KON MANZILI
    QR orqali aniqlangan
    do‘konning address qiymati.
  */
  const deliveryAddress =
    currentShop.address ||
    [
      currentShop.market_name,
      currentShop.row_name,
      currentShop.shop_number
        ? "Do‘kon " +
          currentShop.shop_number
        : ""
    ]
      .filter(Boolean)
      .join(", ");
  /*
    BUYURTMA
  */
  const orderData = {
    shop_code:
      currentShop.shop_code,
    customer_name:
      customerName,
    phone:
      phone,
    delivery_address:
      deliveryAddress,
    items:
      cart.map(item => ({
        id:
          item.id,
        name:
          item.name,
        price:
          Number(item.price),
        quantity:
          item.qty
      })),
    total:
      total,
    status:
      "new",
    note:
      note
  };
  console.log(
    "Yuborilayotgan buyurtma:",
    orderData
  );
  try {
    const response =
      await fetch(
        `${SUPABASE_URL}/rest/v1/orders`,
        {
          method:
            "POST",
          headers: {
            apikey:
              SUPABASE_KEY,
            Authorization:
              `Bearer ${SUPABASE_KEY}`,
            "Content-Type":
              "application/json",
            Prefer:
              "return=representation"
          },
          body:
            JSON.stringify(
              orderData
            )
        }
      );
    const responseText =
      await response.text();
    console.log(
      "Supabase javobi:",
      response.status,
      responseText
    );
    if (!response.ok) {
      alert(
        "BUYURTMA XATOSI:\n\n" +
        responseText
      );
      return;
    }
    let createdOrders = [];
    try {
      createdOrders =
        JSON.parse(
          responseText
        );
    } catch (e) {
      createdOrders = [];
    }
    const createdOrder =
      createdOrders[0];
    const orderNumber =
      createdOrder?.order_number ||
      "Qabul qilindi";
    document.getElementById(
      "orderNumber"
    ).textContent =
      `Buyurtma № ${orderNumber}`;
    document
      .getElementById(
        "cartModal"
      )
      .classList
      .add("hidden");
    document
      .getElementById(
        "successModal"
      )
      .classList
      .remove("hidden");
    /*
      SAVATNI TOZALASH
    */
    cart = [];
    updateCart();
    renderMenu();
    tg?.HapticFeedback
      ?.notificationOccurred(
        "success"
      );
  } catch (error) {
    console.error(
      "ORDER ERROR:",
      error
    );
    alert(
      "Internet yoki server bilan bog‘lanishda xatolik:\n\n" +
      error.message
    );
  }
};
/* =========================
   APPNI ISHGA TUSHIRISH
   ========================= */
async function startApp() {
  try {
    await loadShop();
    await loadMenu();
    updateCart();
  } catch (error) {
    console.error(
      error
    );
    document.getElementById(
      "shopName"
    ).textContent =
      "Ma’lumot yuklanmadi";
    document.getElementById(
      "shopLocation"
    ).textContent =
      "";
    alert(
      "RastaGo ma’lumotlarini yuklashda xatolik:\n\n" +
      error.message
    );
  }
}
startApp();
