/* RastaGo Admin Premium Layer */
(() => {
  const REFRESH_MS = 15000;
  let lastNewCount = null;
  let refreshTimer = null;
  let refreshing = false;

  function haptic(type="light"){
    try{ window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type); }catch(_){}
  }

  function setupTelegram(){
    try{
      const tg = window.Telegram?.WebApp;
      if(!tg) return;
      tg.ready();
      tg.expand();
      tg.setHeaderColor("#0f172a");
      tg.setBackgroundColor("#f4f7fb");
    }catch(_){}
  }

  function addLiveBadge(){
    const row = document.querySelector(".header-row");
    if(!row || document.getElementById("rgLiveStatus")) return;
    const title = row.querySelector("h1");
    if(!title) return;
    const badge = document.createElement("span");
    badge.id = "rgLiveStatus";
    badge.className = "rg-live";
    badge.innerHTML = '<span class="rg-live-dot"></span> LIVE';
    title.appendChild(badge);
  }

  function setOnlineState(){
    const badge = document.getElementById("rgLiveStatus");
    if(!badge) return;
    badge.classList.toggle("offline", !navigator.onLine);
    badge.innerHTML = navigator.onLine
      ? '<span class="rg-live-dot"></span> LIVE'
      : '<span class="rg-live-dot"></span> OFFLINE';
  }

  function markNewCards(){
    document.querySelectorAll(".order-card").forEach(card => {
      const status = card.querySelector(".status");
      if(status && /new|yangi/i.test(status.textContent || "")){
        card.classList.add("rg-new-order");
      }
    });
  }

  async function refresh(){
    if(refreshing || !navigator.onLine) return;
    const fn = window.loadOrders;
    if(typeof fn !== "function") return;
    refreshing = true;
    document.body.classList.add("rg-refreshing");
    try{
      await fn();
      const countEl = document.getElementById("newCount");
      const count = Number(countEl?.textContent || 0);
      if(lastNewCount !== null && count > lastNewCount){
        haptic("medium");
        const alert = document.getElementById("newAlert");
        if(alert){
          alert.style.display = "block";
          clearTimeout(window.__rgAlertTimer);
          window.__rgAlertTimer = setTimeout(() => {
            alert.style.display = "none";
          }, 7000);
        }
      }
      lastNewCount = count;
      markNewCards();
    }catch(err){
      console.error("RastaGo premium refresh:", err);
    }finally{
      refreshing = false;
      document.body.classList.remove("rg-refreshing");
    }
  }

  function hookButtons(){
    document.addEventListener("click", e => {
      const button = e.target.closest("button");
      if(button) haptic("light");
    });
  }

  function init(){
    document.body.classList.add("rg-premium");
    setupTelegram();
    addLiveBadge();
    setOnlineState();
    hookButtons();
    window.addEventListener("online", setOnlineState);
    window.addEventListener("offline", setOnlineState);

    setTimeout(() => {
      const initial = Number(document.getElementById("newCount")?.textContent || 0);
      lastNewCount = initial;
      markNewCards();
    }, 1200);

    if(refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(refresh, REFRESH_MS);

    window.RastaGoAdminPremium = {
      refresh,
      haptic,
      setOnlineState
    };
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init, {once:true});
  }else{
    init();
  }
})();