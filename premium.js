/* RastaGo / BozorFood — Premium Customer JS v2 */

(() => {
  const tg = window.Telegram?.WebApp;

  /* =========================
     TELEGRAM INITIALIZATION
  ========================= */

  try {
    tg?.ready();
    tg?.expand();

    tg?.disableVerticalSwipes?.();

    tg?.setHeaderColor?.("#f5f7fb");
    tg?.setBackgroundColor?.("#f5f7fb");
  } catch (error) {
    console.warn("Telegram WebApp initialization:", error);
  }

  /* =========================
     SEARCH OPTIMIZATION
  ========================= */

  const search = document.getElementById("searchInput");

  if (search) {
    search.autocomplete = "off";
    search.autocorrect = "off";
    search.autocapitalize = "none";
    search.spellcheck = false;
  }

  /* =========================
     HAPTIC FEEDBACK
  ========================= */

  window.rastaHaptic = (type = "light") => {
    try {
      tg?.HapticFeedback?.impactOccurred?.(type);
    } catch (error) {
      console.warn("Haptic error:", error);
    }
  };

  /* =========================
     BUTTON HAPTICS
     
     Actual classes used by app.js:
     .add
     .cat
     #cartButton
     #orderButton
     #closeCart
     #doneButton
  ========================= */

  document.addEventListener(
    "click",
    (event) => {

      const button = event.target.closest(
        ".add, .cat, #cartButton, #orderButton, #closeCart, #doneButton"
      );

      if (!button) return;

      if (button.id === "orderButton") {
        window.rastaHaptic("medium");
      } else {
        window.rastaHaptic("light");
      }
    },
    {
      passive: true
    }
  );

  /* =========================
     NETWORK STATUS
  ========================= */

  const updateNetworkStatus = () => {

    document.body.classList.toggle(
      "is-offline",
      navigator.onLine === false
    );

  };

  window.addEventListener(
    "online",
    updateNetworkStatus
  );

  window.addEventListener(
    "offline",
    updateNetworkStatus
  );

  updateNetworkStatus();

  /* =========================
     PREMIUM API
  ========================= */

  window.RastaGoPremium = {

    version: "2.0",

    haptic: window.rastaHaptic,

    telegram: tg || null

  };

})();
