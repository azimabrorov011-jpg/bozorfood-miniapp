const tg=window.Telegram?.WebApp; tg?.ready(); tg?.expand();
const products=[
{id:1,name:"Osh",cat:"Milliy taomlar",desc:"Issiq osh, sabzi va go‘sht bilan",price:30000,emoji:"🍛"},
{id:2,name:"Lag‘mon",cat:"Milliy taomlar",desc:"Uy lag‘moni, go‘sht va sabzavot",price:28000,emoji:"🍜"},
{id:3,name:"Tovuq shashlik",cat:"Kabob",desc:"Yumshoq tovuq go‘shti",price:18000,emoji:"🍗"},
{id:4,name:"Achchiq-chuchuk",cat:"Salatlar",desc:"Pomidor, piyoz va ko‘kat",price:10000,emoji:"🥗"},
{id:5,name:"Non",cat:"Qo‘shimcha",desc:"Yangi tandir non",price:5000,emoji:"🥖"},
{id:6,name:"Mastava",cat:"Sho‘rva",desc:"Issiq va to‘yimli sho‘rva",price:25000,emoji:"🍲"}
];
let cart={}; let category="Barchasi";
const fmt=n=>n.toLocaleString("uz-UZ")+" so‘m";
const cats=["Barchasi",...new Set(products.map(x=>x.cat))];
const chips=document.querySelector("#chips");
cats.forEach(c=>{let b=document.createElement("button");b.className="chip"+(c==="Barchasi"?" active":"");b.textContent=c;b.onclick=()=>{category=c;document.querySelectorAll(".chip").forEach(x=>x.classList.remove("active"));b.classList.add("active");render()};chips.appendChild(b)});
function render(){
 const q=document.querySelector("#search").value.toLowerCase();
 const list=products.filter(x=>(category==="Barchasi"||x.cat===category)&&x.name.toLowerCase().includes(q));
 document.querySelector("#products").innerHTML=list.map(p=>`<article class="product"><div class="photo">${p.emoji}</div><div class="info"><div class="cat">${p.cat}</div><div class="name">${p.name}</div><div class="desc">${p.desc}</div><div class="price">${fmt(p.price)}</div></div><button class="add" onclick="add(${p.id})">+</button></article>`).join("");
 updateBar();
}
function add(id){cart[id]=(cart[id]||0)+1;updateBar();tg?.HapticFeedback?.impactOccurred("light")}
function change(id,d){cart[id]=(cart[id]||0)+d;if(cart[id]<=0)delete cart[id];openCart()}
function totals(){let count=0,total=0;for(const [id,q] of Object.entries(cart)){let p=products.find(x=>x.id==id);count+=q;total+=p.price*q}return{count,total}}
function updateBar(){let t=totals();document.querySelector("#cartBar").classList.toggle("hidden",!t.count);document.querySelector("#cartCount").textContent=t.count;document.querySelector("#cartTotal").textContent=fmt(t.total)}
function openCart(){let t=totals();document.querySelector("#sheetContent").innerHTML=`<h2>Savat</h2>${Object.entries(cart).map(([id,q])=>{let p=products.find(x=>x.id==id);return `<div class="row"><div><b>${p.emoji} ${p.name}</b><div class="muted">${fmt(p.price)}</div></div><div class="qty"><button onclick="change(${id},-1)">−</button><b>${q}</b><button onclick="change(${id},1)">+</button></div></div>`}).join("")}<div class="total">Jami: ${fmt(t.total)}</div><button class="primary" onclick="checkout()">Davom etish →</button>`;showModal()}
function checkout(){document.querySelector("#sheetContent").innerHTML=`<h2>Buyurtmani tasdiqlash</h2><label class="muted">Telefon raqam</label><input class="field" id="phone" placeholder="+998 90 123 45 67"><label class="muted">Izoh</label><input class="field" id="note" placeholder="Masalan: kamroq piyoz"><label class="muted">To‘lov</label><select class="field" id="payment"><option>Naqd</option><option>Karta</option><option>Online to‘lov</option></select><button class="primary" onclick="placeOrder()">Buyurtma berish ✓</button>`}
function placeOrder(){let t=totals();let no=Math.floor(1000+Math.random()*9000);document.querySelector("#sheetContent").innerHTML=`<div class="success"><div style="font-size:55px">🎉</div><h2>Buyurtma qabul qilindi!</h2><div class="order-no">#${no}</div><div class="muted">B001 · 12-rasta</div><div class="status"><b>🟡 Tayyorlanmoqda</b><br><span class="muted">Oshxona buyurtmangizni tayyorlamoqda.</span></div></div>`;cart={};updateBar();tg?.HapticFeedback?.notificationOccurred("success");}
function showModal(){document.querySelector("#modal").classList.remove("hidden")}
document.querySelector("#openCart").onclick=openCart;
document.querySelector("#closeModal").onclick=()=>document.querySelector("#modal").classList.add("hidden");
document.querySelector("#search").oninput=render;
document.querySelector("#changeStall").onclick=()=>alert("Demo: keyingi versiyada QR orqali rasta avtomatik aniqlanadi.");
render();
