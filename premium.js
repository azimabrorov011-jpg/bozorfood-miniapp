/* RastaGo / BozorFood — Premium Telegram UX */

(() => {
  const tg = window.Telegram?.WebApp;

  if (tg) {
    try {
      tg.ready();
      tg.expand();

      tg.setHeaderColor?.("#111827");
      tg.setBackgroundColor?.("#f5f7fb");

      // Telegram loading screenni tezroq yopish
      tg.disableVerticalSwipes?.();

      // Main button ranglari
      if (tg.MainButton) {
        tg.MainButton.color = "#111827";
        tg.MainButton.textColor = "#ffffff";
      }
    } catch (e) {
      console.debug("Telegram UX:", e);
    }
  }

  // Search input uchun mobil UX
  document.addEventListener("DOMContentLoaded", () => {
    const searchInputs = document.querySelectorAll(
      'input[type="search"], input[placeholder*="Qidir"], input[placeholder*="qidir"]'
    );

    searchInputs.forEach(input => {
      input.setAttribute("autocomplete", "off");
      input.setAttribute("autocorrect", "off");
      input.setAttribute("autocapitalize", "none");
      input.setAttribute("spellcheck", "false");
    });
  });

  // Telegram haptic feedback
  window.rastaHaptic = (type = "light") => {
    try {
      if (!tg?.HapticFeedback) return;

      if (type === "success") {
        tg.HapticFeedback.notificationOccurred("success");
      } else if (type === "error") {
        tg.HapticFeedback.notificationOccurred("error");
      } else if (type === "warning") {
        tg.HapticFeedback.notificationOccurred("warning");
      } else {
        tg.HapticFeedback.impactOccurred("light");
      }
    } catch (e) {
      console.debug("Haptic:", e);
    }
  };

  // Tugmalarga yengil haptic
  document.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button) return;

    if (
      button.matches(
        ".add-btn, .add-button, button.add, .item-add, .category, .category-btn, .category-pill"
      )
    ) {
      window.rastaHaptic("light");
    }
  });

  // Online/offline holatini kuzatish
  function updateConnection() {
    const online = navigator.onLine;

    document.documentElement.classList.toggle("offline", !online);

    if (!online) {
      console.warn("RastaGo: internet connection lost");
    }
  }

  window.addEventListener("online", updateConnection);
  window.addEventListener("offline", updateConnection);

  updateConnection();

  // Global premium helper
  window.RastaGoPremium = {
    haptic: window.rastaHaptic,
    telegram: tg,
    version: "1.0.0"
  };
})();
