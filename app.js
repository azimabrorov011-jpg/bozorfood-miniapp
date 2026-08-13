const tg=window.Telegram?.WebApp;if(tg){tg.ready();tg.expand();}
const shops={B001:{market:"Test bozori",row:"3-qator",shop:"47-do‘kon",name:"Ali oshxonasi"},B002:{market:"Test bozori",row:"2-qator",shop:"18-do‘kon",name:"Dilshod savdo"}};
const menuItems=[
{id:1,name:"Osh",desc:"Mol go‘shtli palov",price:25000,cat:"Issiq ovqat",emoji:"🍛"},
{id:2,name:"Manti",desc:"5 dona, go‘shtli",price:22000,cat:"Issiq ovqat",emoji:"🥟"},
{id:3,name:"Lag‘mon",desc:"Qo‘l cho‘zma lag‘mon",price:24000,cat:"Issiq ovqat",emoji:"🍜"},
{id:4,name:"Shashlik",desc:"Mol go‘shtidan",price:18000,cat:"Kabob",emoji:"🍢"},
{id:5,name:"Somsa",desc:"Go‘shtli tandir somsasi",price:10000,cat:"Pishiriq",emoji:"🥐"},
{id:6,name:"Choy",desc:"Ko‘k yoki qora choy",price:5000,cat:"Ichimlik",emoji:"🍵"}];
let currentCat="Barchasi",cart=[];
function getStartParam(){if(tg?.initDataUnsafe?.start_param)return tg.initDataUnsafe.start_param;const p=new URLSearchParams(location.search);return p.get("startapp")||p.get("start_param")||"B001";}
const id=(getStartParam()||"B001").toUpperCase(),currentShop={id,...(shops[id]||shops.B001)};
document.getElementById("shopName").textContent=currentShop.name;
document.getElementById("shopLocation").textContent=`${currentShop.market} · ${currentShop.row} · ${currentShop.shop}`;
document.getElementById("shopId").textContent=currentShop.id;
const categories=["Barchasi",...new Set(menuItems.map(x=>x.cat))],categoriesEl=document.getElementById("categories");
categories.forEach(cat=>{const b=document.createElement("button");b.className="cat"+(cat===currentCat?" active":"");b.textContent=cat;b.onclick=()=>{currentCat=cat;[...categoriesEl.children].forEach(x=>x.classList.remove("active"));b.classList.add("active");renderMenu()};categoriesEl.appendChild(b)});
function money(n){return n.toLocaleString("uz-UZ")+" so'm"}
function renderMenu(){const q=document.getElementById("searchInput").value.toLowerCase();const f=menuItems.filter(x=>(currentCat==="Barchasi"||x.cat===currentCat)&&(x.name.toLowerCase().includes(q)||x.desc.toLowerCase().includes(q)));document.getElementById("menu").innerHTML=f.map(x=>`<div class="item"><div class="emoji">${x.emoji}</div><div class="info"><h3>${x.name}</h3><p>${x.desc}</p><div class="price">${money(x.price)}</div></div><button class="add" onclick="addToCart(${x.id})">+</button></div>`).join("")}
document.getElementById("searchInput").oninput=renderMenu;
window.addToCart=id=>{const i=menuItems.find(x=>x.id===id),f=cart.find(x=>x.id===id);f?f.qty++:cart.push({...i,qty:1});updateCart();tg?.HapticFeedback?.impactOccurred("light")};
window.changeQty=(id,d)=>{const i=cart.find(x=>x.id===id);if(!i)return;i.qty+=d;if(i.qty<=0)cart=cart.filter(x=>x.id!==id);updateCart()};
function updateCart(){const count=cart.reduce((s,x)=>s+x.qty,0),total=cart.reduce((s,x)=>s+x.qty*x.price,0);document.getElementById("cartCount").textContent=count;document.getElementById("cartTotal").textContent=money(total);document.getElementById("checkoutTotal").textContent=money(total);document.getElementById("cartButton").classList.toggle("hidden",count===0);document.getElementById("cartItems").innerHTML=cart.map(x=>`<div class="cart-row"><div class="grow"><strong>${x.name}</strong><br><small>${money(x.price)}</small></div><div class="qty"><button onclick="changeQty(${x.id},-1)">−</button><strong>${x.qty}</strong><button onclick="changeQty(${x.id},1)">+</button></div></div>`).join("")}
document.getElementById("cartButton").onclick=()=>document.getElementById("cartModal").classList.remove("hidden");
document.getElementById("closeCart").onclick=()=>document.getElementById("cartModal").classList.add("hidden");
document.getElementById("doneButton").onclick=()=>document.getElementById("successModal").classList.add("hidden");
document.getElementById("orderButton").onclick=()=>{if(!cart.length)return;const phone=document.getElementById("phone").value.trim();if(!phone){document.getElementById("phone").focus();return}const order="BF-"+Math.floor(100000+Math.random()*900000);console.log("ORDER PAYLOAD",{order,shop_id:currentShop.id,market:currentShop.market,row:currentShop.row,shop:currentShop.shop,customer_location:currentShop.name,phone,note:document.getElementById("note").value.trim(),items:cart,total:cart.reduce((s,x)=>s+x.qty*x.price,0)});document.getElementById("orderNumber").textContent=`Buyurtma № ${order}`;document.getElementById("cartModal").classList.add("hidden");document.getElementById("successModal").classList.remove("hidden");tg?.HapticFeedback?.notificationOccurred("success")};
renderMenu();updateCart();