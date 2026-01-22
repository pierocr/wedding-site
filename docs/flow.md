# Flow – Regalos pieroydebby.cl

## Variables de entorno (Cloudflare Pages)
Configura en Cloudflare Dashboard → **Workers & Pages** → tu **Pages Project** → **Settings** → **Environment variables** (Production y, opcional, Preview):

- `FLOW_API_KEY` — API key de Flow (producción).
- `FLOW_SECRET_KEY` — Secret para firmar `s`.
- `FLOW_API_URL` — `https://www.flow.cl/api` (default).
- `BASE_URL` — `https://www.pieroydebby.cl` (usa https y sin slash final).
- `NEXT_PUBLIC_SUPABASE_URL` o `SUPABASE_URL`.
- `SUPABASE_SERVICE_ROLE` o `SUPABASE_SERVICE_ROLE_KEY`.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend).
- Email: `RESEND_API_KEY`, `THANKS_FROM` (remitente), `EMAIL_BCC` (opcional).
- (Compatibilidad previa) `THANKS_BCC`, `THANKS_FROM` siguen funcionando.

## URLs y flujo
- `urlConfirmation`: `https://www.pieroydebby.cl/api/flow/webhook` (server-to-server).
- `urlReturn`: `https://www.pieroydebby.cl/pago/resultado` (Flow envía `POST token`).
- El handler `src/app/pago/resultado/route.ts` captura el `POST` y redirige a `GET /pago/resultado?token=...`.
- La UI consulta `GET /api/flow/status?token=...` para mostrar el estado y número de concurso.

## Tablas y metadatos
- Tabla `public.payments`:
  - `status`: `pending | paid | rejected | cancelled`.
  - `donor_name`, `donor_email`, `amount`, `currency`, `external_reference`.
  - `cart` si existe columna (se usa; si falta se guarda en meta).
  - `meta` keys usadas por Flow: `message`, `cart_snapshot`, `flow_token`, `flow_order`, `flow_create_response`, `flow_status_response`, `raffle_number`, `email_sent_at`.
- Tabla `public.webhook_logs`: `source="flow"`, `topic="confirm"`, `data` guarda el form recibido + respuesta de estado.

## Endpoints clave
- `POST /api/flow/create-payment`: valida carrito + datos, crea pago en Flow y fila `payments` (status `pending`) y responde `redirectUrl`.
- `POST /api/flow/webhook`: recibe `token`, consulta `getStatusExtended`, actualiza `payments`, genera `raffle_number` (100000–999999) si pagado, envía comprobante PDF y marca `email_sent_at`. Responde 200 siempre.
- `GET /api/flow/status?token=...`: devuelve `{ status, raffle_number, amount, donor_name, donor_email, cart, message, external_reference }`. Si no es estado final consulta a Flow.
- `POST /api/email/thanks`: reenvía comprobante para un pago `paid` (body con `payment_id`, `external_reference` o `token`).

## Comprobante y correo
- PDF (1 página, `pdf-lib`) incluye: título, fecha/hora, donante, email, mensaje, detalle de regalos, total, estado `PAGADO`, número de concurso, referencia y Flow order/token.
- Email via Resend con el PDF adjunto y número de concurso visible en el cuerpo. Idempotente: no reenvía si `meta.email_sent_at` existe.

## Pruebas E2E sugeridas
1) En local, setear envs de Flow y Supabase (usar `BASE_URL=http://localhost:3000` si corresponde).  
2) Abrir la sección Regalo, armar carrito, completar nombre/email/mensaje.  
3) Al pagar debe redirigir a checkout Flow (Webpay). Completar pago real/sandbox según cuenta.  
4) Flow redirige a `/pago/resultado?token=...`; la página debe mostrar estado correcto y número de concurso cuando está `paid`.  
5) Verificar en Supabase `payments` que `status`, `flow_token`, `external_reference`, `raffle_number`, `email_sent_at` y `meta.flow_status_response` estén presentes.  
6) Revisar `webhook_logs` para confirmar recepción.  
7) Confirmar recepción del email con PDF adjunto.  

## Notas
- No se fuerza `paymentMethod` en Flow para no bloquear débito; en el panel se mantienen Webpay estándar + cuotas.
- El flujo nuevo reemplaza Mercado Pago; los endpoints MP quedan como legacy y no se usan en la UI.
