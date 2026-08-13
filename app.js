const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

const SUPABASE_URL = "https://uqgckzrmibdgxkxdfzav.supabase.co/rest/v1/";
const SUPABASE_KEY = "sb_publishable_KBodwmECQvN46zDKjOwfhg_fet6nBiy";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json"
};

let currentShop = null;
let menuItems = [];
let cart = [];
let currentCat = "Barchasi";

function getStartParam() {
  if (tg?.initDataUnsafe?.start_param) {
    return tg.initDataUnsafe.start_param;
  }

  const p = new URLSearchParams(location.search);

  return (
    p.get("startapp") ||
    p.get("start_param") ||
    "B001"
  );
}

const shopCode = (getStartParam() || "B001").toUpperCase();

async function loadShop() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/shops?shop_code=eq.${encodeURIComponent(shopCode)}&is_active=eq.true&select=*`,
    {
      headers
    }
  );

  if (!response.ok) {
    throw new Error("Do‘konni yuklashda xatolik");
  }

  const shops = await response.json();

  if (!shops.length) {
    throw new Error("Do‘kon topilmadi");
  }

  currentShop = shops[0];

  document.getElementById("shopName").textContent =
    currentShop.display_name;

  document.getElementById("shopLocation").textContent =
    `${currentShop.market_name} · ${currentShop.row_name} · ${currentShop.shop_number}`;

  document.getElementById("shopId").textContent =
    currentShop.shop_code;
}

async function loadMenu() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/menu_items?is_available=eq.true&select=*&order=id.asc`,
    {
      headers
    }
  );

  if (!response.ok) {
    throw new Error("Menyu yuklanmadi");
  }

  menuItems = await response.json();

  renderCategories();
  renderMenu();
}

function renderCategories() {
  const categoriesEl = document.getElementById("categories");

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
    const button = document.createElement("button");

    button.className =
      "cat" + (category === currentCat ? " active" : "");

    button.textContent = category;

    button.onclick = () => {
      currentCat = category;

      [...categoriesEl.children].forEach(x =>
        x.classList.remove("active")
      );

      button.classList.add("active");

      renderMenu();
    };

    categoriesEl.appendChild(button);
  });
}

function money(number) {
  return Number(number).toLocaleString("uz-UZ") + " so'm";
}

function renderMenu() {
  const search =
    document.getElementById("searchInput").value
      .toLowerCase()
      .trim();

  const filtered = menuItems.filter(item => {
    const categoryOk =
      currentCat === "Barchasi" ||
      item.category === currentCat;

    const text =
      `${item.name} ${item.category || ""}`
        .toLowerCase();

    return categoryOk && text.includes(search);
  });

  document.getElementById("menu").innerHTML =
    filtered
      .map(item => {
        const inCart = cart.find(x => x.id === item.id);
        const quantity = inCart ? inCart.qty : 0;

        return `
          <div class="item">
            <div class="emoji">🍽️</div>

            <div class="info">
              <h3>${item.name}</h3>

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
              ${item.stock <= quantity ? "disabled" : ""}
            >
              ${quantity > 0 ? quantity : "+"}
            </button>
          </div>
        `;
      })
      .join("");
}

document.getElementById("searchInput").oninput =
  renderMenu;

window.addToCart = function (id) {
  const item = menuItems.find(x => x.id === id);

  if (!item) return;

  const existing = cart.find(x => x.id === id);

  const currentQty = existing ? existing.qty : 0;

  if (currentQty >= item.stock) {
    alert("Bu mahsulotning qoldig‘i yetarli emas.");
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

  tg?.HapticFeedback?.impactOccurred("light");
};

window.changeQty = function (id, difference) {
  const item = cart.find(x => x.id === id);

  if (!item) return;

  item.qty += difference;

  if (item.qty <= 0) {
    cart = cart.filter(x => x.id !== id);
  }

  updateCart();
  renderMenu();
};

function updateCart() {
  const count = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  const total = cart.reduce(
    (sum, item) => sum + item.qty * Number(item.price),
    0
  );

  document.getElementById("cartCount").textContent =
    count;

  document.getElementById("cartTotal").textContent =
    money(total);

  document.getElementById("checkoutTotal").textContent =
    money(total);

  document.getElementById("cartButton")
    .classList.toggle("hidden", count === 0);

  document.getElementById("cartItems").innerHTML =
    cart
      .map(item => `
        <div class="cart-row">

          <div class="grow">
            <strong>${item.name}</strong>
            <br>
            <small>
              ${money(item.price)}
            </small>
          </div>

          <div class="qty">

            <button
              onclick="changeQty(${item.id}, -1)"
            >
              −
            </button>

            <strong>
              ${item.qty}
            </strong>

            <button
              onclick="changeQty(${item.id}, 1)"
            >
              +
            </button>

          </div>

        </div>
      `)
      .join("");
}

document.getElementById("cartButton").onclick =
  () => {
    document
      .getElementById("cartModal")
      .classList.remove("hidden");
  };

document.getElementById("closeCart").onclick =
  () => {
    document
      .getElementById("cartModal")
      .classList.add("hidden");
  };

document.getElementById("doneButton").onclick =
  () => {
    document
      .getElementById("successModal")
      .classList.add("hidden");
  };

document.getElementById("orderButton").onclick =
  async () => {

    if (!cart.length) {
      alert("Savat bo‘sh.");
      return;
    }

    const phone =
      document.getElementById("phone")
        .value
        .trim();

    if (!phone) {
      document.getElementById("phone").focus();

      alert("Telefon raqamingizni kiriting.");

      return;
    }

    if (!currentShop) {
      alert("Do‘kon ma’lumotlari topilmadi.");
      return;
    }

    const total = cart.reduce(
      (sum, item) =>
        sum + item.qty * Number(item.price),
      0
    );

    const orderNumber =
      "RG-" +
      Math.floor(
        100000 + Math.random() * 900000
      );

    const customerName =
      tg?.initDataUnsafe?.user?.first_name || "";

    const note =
      document.getElementById("note")
        .value
        .trim();

    const orderData = {
      order_number: orderNumber,
      shop_code: currentShop.shop_code,
      customer_name: customerName,
      phone: phone,
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: item.qty
      })),
      total: total,
      status: "new",
      note: note
    };

    try {

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/orders`,
        {
          method: "POST",

          headers: {
            ...headers,
            Prefer: "return=minimal"
          },

          body: JSON.stringify(orderData)
        }
      );

      if (!response.ok) {

        const errorText =
          await response.text();

        console.error(errorText);

        alert(
          "Buyurtmani yuborishda xatolik yuz berdi."
        );

        return;
      }

      document.getElementById("orderNumber")
        .textContent =
        `Buyurtma № ${orderNumber}`;

      document
        .getElementById("cartModal")
        .classList.add("hidden");

      document
        .getElementById("successModal")
        .classList.remove("hidden");

      cart = [];

      updateCart();
      renderMenu();

      tg?.HapticFeedback
        ?.notificationOccurred("success");

    } catch (error) {

      console.error(error);

      alert(
        "Internet yoki server bilan bog‘lanishda xatolik."
      );
    }
  };

async function startApp() {
  try {

    await loadShop();

    await loadMenu();

    updateCart();

  } catch (error) {

    console.error(error);

    document.getElementById("shopName")
      .textContent =
      "Ma’lumot yuklanmadi";

    alert(
      "RastaGo ma’lumotlarini yuklashda xatolik yuz berdi."
    );
  }
}

startApp();
