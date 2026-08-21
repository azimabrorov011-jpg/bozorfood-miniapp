(() => {
  const SUPABASE_URL = "https://uqgckzrmibdgxkxdfzav.supabase.co";
  const ENDPOINT = SUPABASE_URL + "/functions/v1/staff-api";

  function telegram() {
    return window.Telegram?.WebApp || null;
  }

  function initTelegram() {
    try {
      telegram()?.ready();
      telegram()?.expand();
    } catch (_) {}
  }

  function readableError(payload, status) {
    const code = payload?.error || "";
    const messages = {
      STAFF_ACCESS_DENIED: "Sizga bu panelga kirish ruxsati berilmagan.",
      FORBIDDEN: "Bu amal uchun sizda yetarli huquq yo‘q.",
      TELEGRAM_INIT_DATA_REQUIRED: "Panelni bot ichidagi Web App tugmasi orqali qayta oching.",
      TELEGRAM_INIT_DATA_EXPIRED: "Telegram sessiyasi eskirgan. Panelni qayta oching.",
      TELEGRAM_SIGNATURE_INVALID: "Telegram sessiyasi tasdiqlanmadi.",
      TELEGRAM_INIT_DATA_INVALID: "Telegram sessiyasi noto‘g‘ri.",
      SERVER_ERROR: "Serverda xatolik yuz berdi.",
    };

    return messages[code] || payload?.detail || payload?.message ||
      (status ? "Server xatosi (" + status + ")" : "Noma’lum xatolik");
  }

  function initDataFromHash() {
    try {
      const hash = String(window.location.hash || "").replace(/^#/, "");
      const params = new URLSearchParams(hash);
      return params.get("tgWebAppData") || "";
    } catch (_) {
      return "";
    }
  }

  async function getInitData() {
    initTelegram();

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const app = telegram();
      const initData = app?.initData || initDataFromHash();
      if (initData) return initData;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    return "";
  }

  async function call(action, body = {}) {
    const initData = await getInitData();
    if (!initData) {
      throw new Error("Panelni bot ichidagi Web App tugmasi orqali qayta oching.");
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-telegram-init-data": initData,
      },
      body: JSON.stringify({ action, ...body }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      throw new Error(readableError(payload, response.status));
    }

    return payload;
  }

  window.RastaGoStaffApi = {
    call,
    whoami: () => call("whoami"),
    initTelegram,
    telegram,
  };
})();
