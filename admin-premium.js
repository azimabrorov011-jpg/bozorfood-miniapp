/* =========================================================
   RASTAGO ADMIN PREMIUM
   REALTIME COMMAND CENTER
   Version: 3.0
   ========================================================= */

(() => {
  "use strict";

  const REFRESH_FALLBACK = 15000;

  let initialized = false;
  let refreshTimer = null;
  let refreshRunning = false;
  let lastNewCount = null;
  let unsubscribeRealtime = null;
  let alertTimer = null;

  /* =======================================================
     TELEGRAM
     ======================================================= */

  function tg() {
    return window.Telegram?.WebApp || null;
  }

  function haptic(type = "light") {
    try {
      tg()?.HapticFeedback?.impactOccurred?.(type);
    } catch (_) {}
  }

  function setupTelegram() {
    try {
      const app = tg();

      if (!app) return;

      app.ready();
      app.expand();
      app.disableVerticalSwipes?.();

      app.setHeaderColor?.("#0f172a");
      app.setBackgroundColor?.("#f4f7fb");

    } catch (error) {
      console.warn("Telegram Admin:", error);
    }
  }


  /* =======================================================
     ESCAPE
     ======================================================= */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  /* =======================================================
     LIVE BADGE
     ======================================================= */

  function createLiveBadge() {

    const row =
      document.querySelector(".header-row");

    if (!row) return;

    if (document.getElementById("rgLiveStatus")) {
      return;
    }

    const title =
      row.querySelector("h1");

    if (!title) return;

    const badge =
      document.createElement("span");

    badge.id = "rgLiveStatus";

    badge.className = "rg-live";

    badge.innerHTML =
      '<span class="rg-live-dot"></span> LIVE';

    title.appendChild(badge);
  }


  function setLiveStatus(status) {

    const badge =
      document.getElementById("rgLiveStatus");

    if (!badge) return;

    badge.classList.remove(
      "offline",
      "connecting"
    );

    if (status === "connected") {

      badge.innerHTML =
        '<span class="rg-live-dot"></span> LIVE';

      return;
    }

    if (status === "connecting") {

      badge.classList.add("connecting");

      badge.innerHTML =
        '<span class="rg-live-dot"></span> ULANMOQDA...';

      return;
    }

    badge.classList.add("offline");

    badge.innerHTML =
      '<span class="rg-live-dot"></span> OFFLINE';
  }


  /* =======================================================
     NETWORK
     ======================================================= */

  function updateNetwork() {

    if (navigator.onLine) {

      if (
        window.RastaGoRealtime?.isConnected?.()
      ) {
        setLiveStatus("connected");
      }

    } else {

      setLiveStatus("offline");

    }
  }


  /* =======================================================
     REFRESH
     ======================================================= */

  async function refreshOrders(reason = "manual") {

    if (refreshRunning) return;

    if (!navigator.onLine) return;

    if (
      typeof window.loadOrders !==
      "function"
    ) {
      console.warn(
        "RastaGo Admin: loadOrders topilmadi"
      );
      return;
    }

    refreshRunning = true;

    document.body.classList.add(
      "rg-refreshing"
    );

    try {

      await window.loadOrders();

      markNewOrders();

      if (reason === "realtime") {

        document.body.classList.add(
          "rg-live-update"
        );

        setTimeout(() => {
          document.body.classList.remove(
            "rg-live-update"
          );
        }, 900);
      }

    } catch (error) {

      console.error(
        "Admin refresh:",
        error
      );

    } finally {

      refreshRunning = false;

      document.body.classList.remove(
        "rg-refreshing"
      );
    }
  }


  /* =======================================================
     NEW ORDER DETECTION
     ======================================================= */

  function getNewCount() {

    const element =
      document.getElementById(
        "newCount"
      );

    if (!element) return 0;

    return Number(
      element.textContent
        .replace(/[^\d]/g, "")
    ) || 0;
  }


  function showNewOrderAlert(count) {

    const alert =
      document.getElementById(
        "newAlert"
      );

    if (!alert) return;

    alert.style.display = "block";

    alert.innerHTML =
      `
      🔔
      <strong>Yangi buyurtma!</strong>
      <br>
      <span>
        ${count} ta yangi buyurtma mavjud.
      </span>
      `;

    clearTimeout(alertTimer);

    alertTimer =
      setTimeout(() => {

        alert.style.display =
          "none";

      }, 8000);

    haptic("medium");

    /* Telegram notification */

    try {

      tg()?.HapticFeedback
        ?.notificationOccurred?.(
          "success"
        );

    } catch (_) {}
  }


  function checkNewOrders() {

    const count =
      getNewCount();

    if (
      lastNewCount !== null &&
      count > lastNewCount
    ) {

      showNewOrderAlert(count);

    }

    lastNewCount = count;
  }


  /* =======================================================
     NEW ORDER VISUAL MARK
     ======================================================= */

  function markNewOrders() {

    document
      .querySelectorAll(
        ".order-card"
      )
      .forEach(card => {

        const status =
          card.querySelector(
            ".status"
          );

        if (!status) return;

        const text =
          status.textContent
            ?.trim()
            ?.toLowerCase() || "";

        const isNew =
          text.includes("new") ||
          text.includes("yangi");

        card.classList.toggle(
          "rg-new-order",
          isNew
        );
      });
  }


  /* =======================================================
     REALTIME EVENT
     ======================================================= */

  async function handleRealtime(event) {

    if (!event) return;


    /* -----------------------------------------
       CONNECTION
       ----------------------------------------- */

    if (
      event.type ===
      "connecting"
    ) {

      setLiveStatus(
        "connecting"
      );

      return;
    }


    if (
      event.type ===
      "connected"
    ) {

      setLiveStatus(
        "connected"
      );

      /*
       * Connection qaytganda
       * database bilan sinxronlash.
       */

      await refreshOrders(
        "realtime"
      );

      return;
    }


    if (
      event.type ===
      "disconnected" ||
      event.type ===
      "error" ||
      event.type ===
      "offline"
    ) {

      setLiveStatus(
        "offline"
      );

      return;
    }


    /* -----------------------------------------
       ORDER EVENTS
       ----------------------------------------- */

    if (
      event.table ===
      "orders"
    ) {

      /*
       * INSERT:
       * yangi buyurtma.
       */

      if (
        event.event ===
        "INSERT"
      ) {

        showNewOrderAlert(
          Math.max(
            getNewCount() + 1,
            1
          )
        );

      }

      /*
       * UPDATE:
       * status, total, courier va h.k.
       */

      await refreshOrders(
        "realtime"
      );

      return;
    }


    /* -----------------------------------------
       ASSIGNMENTS
       ----------------------------------------- */

    if (
      event.table ===
      "order_assignments"
    ) {

      await refreshOrders(
        "realtime"
      );

      return;
    }


    /* -----------------------------------------
       STATUS HISTORY
       ----------------------------------------- */

    if (
      event.table ===
      "order_status_history"
    ) {

      await refreshOrders(
        "realtime"
      );

      return;
    }


    /* -----------------------------------------
       KITCHEN
       ----------------------------------------- */

    if (
      event.table ===
      "kitchen_items"
    ) {

      await refreshOrders(
        "realtime"
      );

      return;
    }

  }


  /* =======================================================
     REALTIME CONNECT
     ======================================================= */

  function connectRealtime() {

    if (
      !window.RastaGoRealtime
    ) {

      console.warn(
        "RastaGoRealtime mavjud emas"
      );

      setLiveStatus(
        "offline"
      );

      return;
    }


    if (unsubscribeRealtime) {

      try {
        unsubscribeRealtime();
      } catch (_) {}

      unsubscribeRealtime =
        null;
    }


    unsubscribeRealtime =
      window.RastaGoRealtime.on(
        handleRealtime
      );


    if (
      window.RastaGoRealtime
        .isConnected?.()
    ) {

      setLiveStatus(
        "connected"
      );

    } else {

      setLiveStatus(
        "connecting"
      );
    }
  }


  /* =======================================================
     FALLBACK POLLING
     ======================================================= */

  function startFallbackPolling() {

    clearInterval(
      refreshTimer
    );

    refreshTimer =
      setInterval(() => {

        /*
         * Realtime ishlamay qolsa,
         * Admin butunlay jim bo‘lib qolmasin.
         */

        if (
          !window.RastaGoRealtime
            ?.isConnected?.()
        ) {

          refreshOrders(
            "fallback"
          );

        }

      }, REFRESH_FALLBACK);
  }


  /* =======================================================
     BUTTON HAPTICS
     ======================================================= */

  function setupButtonHaptics() {

    document.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "button"
          );

        if (!button) return;

        haptic("light");

      },
      {
        passive: true
      }
    );
  }


  /* =======================================================
     VISIBILITY
     ======================================================= */

  function setupVisibility() {

    document.addEventListener(
      "visibilitychange",
      () => {

        if (
          document.visibilityState ===
          "visible"
        ) {

          updateNetwork();

          if (
            !window.RastaGoRealtime
              ?.isConnected?.()
          ) {

            window.RastaGoRealtime
              ?.start?.();

          }

          refreshOrders(
            "visibility"
          );

        }

      }
    );
  }


  /* =======================================================
     ONLINE / OFFLINE
     ======================================================= */

  function setupNetworkEvents() {

    window.addEventListener(
      "online",
      () => {

        setLiveStatus(
          "connecting"
        );

        window.RastaGoRealtime
          ?.start?.();

        refreshOrders(
          "online"
        );

      }
    );


    window.addEventListener(
      "offline",
      () => {

        setLiveStatus(
          "offline"
        );

      }
    );
  }


  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  async function initialize() {

    if (initialized) return;

    initialized = true;

    document.body.classList.add(
      "rg-premium"
    );


    setupTelegram();

    createLiveBadge();

    setLiveStatus(
      "connecting"
    );


    setupButtonHaptics();

    setupVisibility();

    setupNetworkEvents();


    /*
     * Birinchi database yuklanishi.
     */

    await refreshOrders(
      "initial"
    );


    /*
     * Hozirgi yangi buyurtmalar
     * baseline bo‘ladi.
     */

    lastNewCount =
      getNewCount();


    markNewOrders();


    /*
     * Realtime.
     */

    connectRealtime();


    /*
     * Realtime ishlamasa fallback.
     */

    startFallbackPolling();


    /*
     * Global API.
     */

    window.RastaGoAdminPremium = {

      refresh:
        () =>
          refreshOrders(
            "manual"
          ),

      haptic,

      reconnect:
        () => {
          setLiveStatus(
            "connecting"
          );

          return window
            .RastaGoRealtime
            ?.start?.();
        },

      status:
        () =>
          window.RastaGoRealtime
            ?.isConnected?.() || false

    };


    console.log(
      "%cRastaGo Admin Premium 3.0",
      "color:#2563eb;font-size:16px;font-weight:800"
    );

  }


  /* =======================================================
     START
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      { once: true }
    );

  } else {

    initialize();

  }

})();
