/* BozorFood secure order bridge v2
   Replaces the client-side direct INSERT with the secure Supabase RPC.
   Does not depend on app.js top-level let/const variables.
*/
(() => {
  const button = document.getElementById('orderButton');
  if (!button) return;

  const SUPABASE_URL = 'https://uqgckzrmibdgxkxdfzav.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_KBodwmECQvN46zDKjOwfhg_fet6nBiy';
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  const uuid = () => {
    if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 3 | 8);
      return v.toString(16);
    });
  };

  const text = (selector) => (document.querySelector(selector)?.textContent || '').trim();

  button.onclick = async () => {
    const phone = (document.getElementById('phone')?.value || '').trim();
    if (!phone) {
      alert('Telefon raqamingizni kiriting.');
      document.getElementById('phone')?.focus();
      return;
    }

    const shopCode = text('#shopId').toUpperCase();
    if (!shopCode) {
      alert('Do‘kon kodi topilmadi.');
      return;
    }

    const cartRows = [...document.querySelectorAll('#cartItems .cart-row')];
    if (!cartRows.length) {
      alert('Savat bo‘sh.');
      return;
    }

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Tekshirilmoqda…';

    try {
      const [shopRes, menuRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/shops?shop_code=eq.${encodeURIComponent(shopCode)}&is_active=eq.true&select=*`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/menu_items?shop_code=eq.${encodeURIComponent(shopCode)}&select=*`, { headers })
      ]);

      if (!shopRes.ok || !menuRes.ok) throw new Error('SHOP_MENU_LOAD_FAILED');
      const shops = await shopRes.json();
      const menu = await menuRes.json();
      const shop = shops[0];
      if (!shop) throw new Error('SHOP_NOT_FOUND');

      const items = [];
      for (const row of cartRows) {
        const name = (row.querySelector('.grow strong')?.textContent || '').trim();
        const qty = Number(row.querySelector('.qty strong')?.textContent || 0);
        const item = menu.find(x => String(x.name).trim() === name);
        if (!item || !qty || qty < 1) throw new Error('ITEM_NOT_FOUND');
        items.push({ id: item.id, quantity: qty });
      }

      const total = items.reduce((sum, x) => {
        const item = menu.find(m => Number(m.id) === Number(x.id));
        return sum + Number(item.price) * x.quantity;
      }, 0);

      const tg = window.Telegram?.WebApp;
      const customerName = tg?.initDataUnsafe?.user?.first_name || '';
      const note = (document.getElementById('note')?.value || '').trim();
      const address = shop.address || [
        shop.market_name,
        shop.row_name,
        shop.shop_number ? `Do‘kon ${shop.shop_number}` : ''
      ].filter(Boolean).join(', ');

      button.textContent = 'Yuborilmoqda…';
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_customer_order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_shop_code: shop.shop_code,
          p_customer_name: customerName,
          p_phone: phone,
          p_items: items,
          p_total: total,
          p_note: note || null,
          p_delivery_address: address || null,
          p_client_request_id: uuid()
        })
      });

      const raw = await response.text();
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch (_) {}

      if (!response.ok) {
        const msg = raw || '';
        if (msg.includes('INSUFFICIENT_STOCK')) throw new Error('Qoldiq yetarli emas. Menyuni yangilang.');
        if (msg.includes('ITEM_NOT_AVAILABLE')) throw new Error('Mahsulotlardan biri hozir mavjud emas.');
        if (msg.includes('TOTAL_MISMATCH')) throw new Error('Narxlar yangilangan. Savatni qayta tekshiring.');
        if (msg.includes('SHOP_REQUIRED')) throw new Error('Do‘kon aniqlanmadi.');
        throw new Error('Buyurtma yuborilmadi. Server xatosi.');
      }

      const order = Array.isArray(data) ? data[0] : data;
      document.getElementById('orderNumber').textContent = `Buyurtma № ${order?.order_number || 'Qabul qilindi'}`;
      document.getElementById('cartModal')?.classList.add('hidden');
      document.getElementById('successModal')?.classList.remove('hidden');
      tg?.HapticFeedback?.notificationOccurred('success');

      // app.js cart is lexical-scoped; reload after confirmation to clear it safely.
      setTimeout(() => location.reload(), 1800);
    } catch (error) {
      console.error('Secure order error:', error);
      alert(error?.message || 'Internet yoki server bilan bog‘lanishda xatolik.');
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  };
})();
