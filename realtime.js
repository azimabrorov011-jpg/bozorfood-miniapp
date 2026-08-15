/* =========================================================
   RASTAGO / BOZORFOOD
   SHARED SUPABASE REALTIME ENGINE
   Version: 1.0
   ========================================================= */

(() => {
  "use strict";

  const SUPABASE_URL =
    "https://uqgckzrmibdgxkxdfzav.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_KBodwmECQvN46zDKjOwfhg_fet6nBiy";

  const SUPABASE_JS =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

  const CHANNEL_NAME =
    "rastago-production-live";

  const TABLES = [
    "orders",
    "order_assignments",
    "order_status_history",
    "kitchen_items",
    "menu_items"
  ];

  let client = null;
  let channel = null;
  let started = false;
  let reconnectTimer = null;
  let heartbeatTimer = null;

  const listeners = new Set();

  /* =======================================================
     LOGGER
     ======================================================= */

  function log(...args) {
    console.log(
      "%c[RastaGo Realtime]",
      "color:#2563eb;font-weight:700",
      ...args
    );
  }

  function warn(...args) {
    console.warn(
      "%c[RastaGo Realtime]",
      "color:#dc2626;font-weight:700",
      ...args
    );
  }

  /* =======================================================
     EVENT EMITTER
     ======================================================= */

  function emit(event) {
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(
          "[RastaGo Realtime listener]",
          error
        );
      }
    });

    window.dispatchEvent(
      new CustomEvent("rastago:realtime", {
        detail: event
      })
    );
  }

  /* =======================================================
     LOAD SUPABASE JS
     ======================================================= */

  function loadSupabaseScript() {
    return new Promise((resolve, reject) => {

      if (
        window.supabase &&
        typeof window.supabase.createClient === "function"
      ) {
        resolve();
        return;
      }

      const existing =
        document.querySelector(
          `script[src="${SUPABASE_JS}"]`
        );

      if (existing) {

        existing.addEventListener(
          "load",
          () => resolve(),
          { once: true }
        );

        existing.addEventListener(
          "error",
          reject,
          { once: true }
        );

        return;
      }

      const script =
        document.createElement("script");

      script.src = SUPABASE_JS;
      script.async = true;

      script.onload = () => resolve();

      script.onerror = () => {
        reject(
          new Error(
            "Supabase JS yuklanmadi"
          )
        );
      };

      document.head.appendChild(script);
    });
  }

  /* =======================================================
     CREATE CLIENT
     ======================================================= */

  async function createClient() {

    await loadSupabaseScript();

    if (!window.supabase) {
      throw new Error(
        "Supabase kutubxonasi topilmadi"
      );
    }

    client =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );

    return client;
  }

  /* =======================================================
     REMOVE OLD CHANNEL
     ======================================================= */

  async function removeChannel() {

    if (!client || !channel) {
      channel = null;
      return;
    }

    try {
      await client.removeChannel(
        channel
      );
    } catch (error) {
      warn(
        "Channel o‘chirish xatosi:",
        error
      );
    }

    channel = null;
  }

  /* =======================================================
     CREATE REALTIME CHANNEL
     ======================================================= */

  async function subscribe() {

    if (!client) {
      await createClient();
    }

    await removeChannel();

    log(
      "Realtime channel yaratilmoqda..."
    );

    channel =
      client
        .channel(CHANNEL_NAME);

    /* -------------------------------------------------------
       ORDERS
       ------------------------------------------------------- */

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders"
      },
      (payload) => {

        emit({
          type: "order",
          table: "orders",
          event: payload.eventType,
          new: payload.new || null,
          old: payload.old || null,
          payload
        });

      }
    );

    /* -------------------------------------------------------
       ORDER ASSIGNMENTS
       ------------------------------------------------------- */

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "order_assignments"
      },
      (payload) => {

        emit({
          type: "assignment",
          table: "order_assignments",
          event: payload.eventType,
          new: payload.new || null,
          old: payload.old || null,
          payload
        });

      }
    );

    /* -------------------------------------------------------
       ORDER STATUS HISTORY
       ------------------------------------------------------- */

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "order_status_history"
      },
      (payload) => {

        emit({
          type: "status",
          table: "order_status_history",
          event: payload.eventType,
          new: payload.new || null,
          old: payload.old || null,
          payload
        });

      }
    );

    /* -------------------------------------------------------
       KITCHEN ITEMS
       ------------------------------------------------------- */

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "kitchen_items"
      },
      (payload) => {

        emit({
          type: "kitchen",
          table: "kitchen_items",
          event: payload.eventType,
          new: payload.new || null,
          old: payload.old || null,
          payload
        });

      }
    );

    /* -------------------------------------------------------
       MENU ITEMS
       ------------------------------------------------------- */

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "menu_items"
      },
      (payload) => {

        emit({
          type: "menu",
          table: "menu_items",
          event: payload.eventType,
          new: payload.new || null,
          old: payload.old || null,
          payload
        });

      }
    );

    /* -------------------------------------------------------
       CHANNEL STATUS
       ------------------------------------------------------- */

    channel.subscribe(
      (status, error) => {

        log(
          "Channel status:",
          status
        );

        if (error) {
          warn(
            "Realtime error:",
            error
          );
        }

        if (
          status === "SUBSCRIBED"
        ) {

          started = true;

          emit({
            type: "connected",
            status
          });

          startHeartbeat();

          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {

          started = false;

          emit({
            type: "disconnected",
            status,
            error: error || null
          });

          scheduleReconnect();
        }
      }
    );
  }

  /* =======================================================
     RECONNECT
     ======================================================= */

  function scheduleReconnect() {

    if (reconnectTimer) {
      return;
    }

    reconnectTimer =
      setTimeout(
        async () => {

          reconnectTimer = null;

          try {

            await subscribe();

          } catch (error) {

            warn(
              "Reconnect xatosi:",
              error
            );

            scheduleReconnect();
          }

        },
        3000
      );
  }

  /* =======================================================
     HEARTBEAT
     ======================================================= */

  function startHeartbeat() {

    stopHeartbeat();

    heartbeatTimer =
      setInterval(() => {

        if (
          !channel ||
          !client
        ) {
          return;
        }

        if (
          document.visibilityState ===
          "hidden"
        ) {
          return;
        }

        /*
          Supabase Realtime o‘zi
          heartbeat boshqaradi.

          Bu interval faqat
          connection holatini tekshiradi.
        */

        if (!started) {
          scheduleReconnect();
        }

      }, 15000);
  }

  function stopHeartbeat() {

    if (heartbeatTimer) {

      clearInterval(
        heartbeatTimer
      );

      heartbeatTimer = null;
    }
  }

  /* =======================================================
     START
     ======================================================= */

  async function start() {

    if (started) {
      return;
    }

    try {

      emit({
        type: "connecting"
      });

      await subscribe();

    } catch (error) {

      warn(
        "Realtime start error:",
        error
      );

      emit({
        type: "error",
        error
      });

      scheduleReconnect();
    }
  }

  /* =======================================================
     STOP
     ======================================================= */

  async function stop() {

    started = false;

    stopHeartbeat();

    if (reconnectTimer) {

      clearTimeout(
        reconnectTimer
      );

      reconnectTimer = null;
    }

    await removeChannel();

    emit({
      type: "stopped"
    });
  }

  /* =======================================================
     LISTENER API
     ======================================================= */

  function on(listener) {

    if (
      typeof listener !==
      "function"
    ) {
      throw new TypeError(
        "Realtime listener function bo‘lishi kerak"
      );
    }

    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }

  /* =======================================================
     STATUS
     ======================================================= */

  function isConnected() {

    return (
      started &&
      !!channel
    );
  }

  function getClient() {
    return client;
  }

  function getChannel() {
    return channel;
  }

  /* =======================================================
     VISIBILITY
     ======================================================= */

  document.addEventListener(
    "visibilitychange",
    () => {

      if (
        document.visibilityState ===
        "visible"
      ) {

        if (!isConnected()) {
          start();
        }

      }

    }
  );

  /* =======================================================
     NETWORK
     ======================================================= */

  window.addEventListener(
    "online",
    () => {

      log(
        "Internet qaytdi"
      );

      if (!isConnected()) {
        start();
      }

    }
  );

  window.addEventListener(
    "offline",
    () => {

      emit({
        type: "offline"
      });

    }
  );

  /* =======================================================
     GLOBAL API
     ======================================================= */

  window.RastaGoRealtime = {

    start,

    stop,

    on,

    isConnected,

    getClient,

    getChannel,

    tables: TABLES,

    version: "1.0.0"

  };

  /* =======================================================
     AUTO START
     ======================================================= */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      () => {
        start();
      },
      { once: true }
    );

  } else {

    start();

  }

})();
