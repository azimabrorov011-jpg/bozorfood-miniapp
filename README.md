# BozorFood / RastaGo

Premium Telegram Mini App for hot-food delivery inside markets.

## Product flow

Customer opens a QR/deep link for a numbered stall → chooses food → checks out → Admin receives the order → Kitchen prepares it → Courier takes and delivers it → Analytics tracks the result.

## Frontend

- Customer Mini App: index.html
- Admin panel: admin.html
- Kitchen panel: kitchen.html
- Courier panel: courier.html
- Analytics: analytics.html
- Shared customer styling: styles.css, premium.css
- Shared staff styling: staff-ui.css

## Security

- Staff panels authenticate through the Telegram Web App signature and the Supabase staff-api Edge Function.
- Staff roles are checked server-side: admin, ops, kitchen, and courier.
- Staff order RPCs are executable only by service_role.
- Customer order creation uses the atomic create_customer_order RPC, which validates prices, stock and idempotency on the server.

## Deploy

The repository is deployed through GitHub Pages:

https://azimabrorov011-jpg.github.io/bozorfood-miniapp/

Staff panels must be opened from Telegram so the verified Web App init data is available.
