/* RastaGo secure order bridge — production-safe client bridge.
   Intercepts the legacy REST order POST and routes it to the atomic Supabase RPC. */
(() => {
  const originalFetch = window.fetch.bind(window);
  const SUPABASE_URL = "https://uqgckzrmibdgxkxdfzav.supabase.co";
  const SUPABASE_KEY = "sb_publishable_KBodwmECQvN46zDKjOwfhg_fet6nBiy";

  function uuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 3 | 8);
      return v.toString(16);
    });
  }

  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url || "";
    const method = (init.method || (typeof input !== "string" ? input.method : "GET") || "GET").toUpperCase();

    if (method === "POST" && url.includes("/rest/v1/orders")) {
      let body = init.body;
      try {
        const order = typeof body === "string" ? JSON.parse(body) : body;
        const items = (order.items || []).map(x => ({ id: Number(x.id), quantity: Number(x.quantity) }));
        const payload = {
          p_shop_code: order.shop_code,
          p_customer_name: order.customer_name || "",
          p_phone: order.phone || "",
          p_items: items,
          p_total: Number(order.total || 0),
          p_note: order.note || null,
          p_delivery_address: order.delivery_address || null,
          p_client_request_id: uuid()
        };
        const rpc = await originalFetch(`${SUPABASE_URL}/rest/v1/rpc/create_customer_order`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },
          body: JSON.stringify(payload)
        });

        if (!rpc.ok) return rpc;
        const result = await rpc.json();
        const row = result?.[0] || result || {};
        const responseBody = JSON.stringify([{
          id: row.id,
          order_number: row.order_number,
          shop_code: order.shop_code,
          status: "new"
        }]);
        return new Response(responseBody, {
          status: 201,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        console.error("RastaGo secure order bridge:", err);
        return new Response(JSON.stringify({ message: err.message || "Buyurtma xatosi" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    return originalFetch(input, init);
  };
})();
