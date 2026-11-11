// Función de Supabase «vip»: cobro de la membresía con Stripe.
//
//  POST { accion: "listo" }                    -> { listo }            ¿está configurado el cobro?
//  POST { accion: "checkout" }                 -> { url }              abre Stripe Checkout (5 días gratis)
//  POST { accion: "recuperar", sesion }        -> { codigo, activo, hasta }  tras volver de pagar
//  POST { accion: "estado", codigo }           -> { activo, hasta }    comprueba un código VIP
//  POST { accion: "portal", codigo }           -> { url }              gestionar o cancelar la suscripción
//  POST ?accion=webhook (lo llama Stripe)      -> sincroniza renovaciones y cancelaciones
//
// Secretos (Supabase > Edge Functions > Secrets): STRIPE_SECRET_KEY, STRIPE_PRICE_ID, STRIPE_WEBHOOK_SECRET.
// Opcional: SITE_URL (por defecto https://entrenador-cartas.onrender.com) y DIAS_PRUEBA (por defecto 5).
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SITE = (Deno.env.get("SITE_URL") ?? "https://entrenador-cartas.onrender.com").replace(/\/$/, "");
const DIAS_PRUEBA = Number(Deno.env.get("DIAS_PRUEBA") ?? "5");
const STRIPE_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const STRIPE_PRICE = Deno.env.get("STRIPE_PRICE_ID") ?? "";
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...cors, "Content-Type": "application/json" } });

const cobroListo = () => Boolean(STRIPE_KEY && STRIPE_PRICE && WEBHOOK_SECRET);

// ---------- Stripe (API REST, sin SDK) ----------
async function stripe(ruta: string, params?: Record<string, string>, metodo = "POST") {
  const init: RequestInit = { method: metodo, headers: { Authorization: `Bearer ${STRIPE_KEY}` } };
  let url = `https://api.stripe.com/v1/${ruta}`;
  if (params && metodo === "POST") {
    (init.headers as Record<string, string>)["Content-Type"] = "application/x-www-form-urlencoded";
    init.body = new URLSearchParams(params).toString();
  } else if (params) {
    url += "?" + new URLSearchParams(params).toString();
  }
  const r = await fetch(url, init);
  const datos = await r.json();
  if (!r.ok) throw new Error(datos?.error?.message ?? `Stripe ${r.status}`);
  return datos;
}

// Firma del webhook: HMAC-SHA256 de "t.cuerpo" con el secreto, comparada en tiempo constante
async function verificarFirma(cuerpo: string, cabecera: string, secreto: string, ahora = Date.now()) {
  const partes = Object.fromEntries(cabecera.split(",").map((p) => p.split("=") as [string, string]));
  const t = partes["t"];
  const firmas = cabecera.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !firmas.length || Math.abs(ahora / 1000 - Number(t)) > 300) return false;
  const clave = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(`${t}.${cuerpo}`)));
  const esperada = Array.from(mac).map((b) => b.toString(16).padStart(2, "0")).join("");
  return firmas.some((f) => {
    if (f.length !== esperada.length) return false;
    let d = 0;
    for (let i = 0; i < f.length; i++) d |= f.charCodeAt(i) ^ esperada.charCodeAt(i);
    return d === 0;
  });
}

// ---------- licencias ----------
function codigoNuevo() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = crypto.getRandomValues(new Uint8Array(12));
  const c = Array.from(b, (x) => abc[x % abc.length]).join("");
  return `VIP-${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`;
}

// hasta (en segundos) y si está vigente, a partir de una suscripción de Stripe
function datosDeSuscripcion(sub: any) {
  const periodo = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end ?? 0;
  const hasta = Math.max(Number(sub.trial_end ?? 0), Number(periodo));
  return { estado: String(sub.status), hasta: new Date(hasta * 1000).toISOString() };
}

async function guardarSuscripcion(sub: any) {
  const { estado, hasta } = datosDeSuscripcion(sub);
  const cliente = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const { data: fila } = await db.from("vip_licencias").select("codigo").eq("stripe_subscription_id", sub.id).maybeSingle();
  if (fila) {
    await db.from("vip_licencias").update({ estado, hasta, actualizado: new Date().toISOString() }).eq("codigo", fila.codigo);
    return fila.codigo as string;
  }
  const codigo = codigoNuevo();
  const { error } = await db.from("vip_licencias").insert({ codigo, stripe_customer_id: cliente, stripe_subscription_id: sub.id, estado, hasta });
  if (error) {
    // otra petición (por ejemplo el webhook) la creó a la vez
    const { data: otra } = await db.from("vip_licencias").select("codigo").eq("stripe_subscription_id", sub.id).maybeSingle();
    if (otra) return otra.codigo as string;
    throw error;
  }
  return codigo;
}

const vigente = (f: { estado: string; hasta: string }) => ["trialing", "active"].includes(f.estado) && new Date(f.hasta).getTime() > Date.now();
const respuestaEstado = (f: { estado: string; hasta: string }) => ({ activo: vigente(f), hasta: new Date(f.hasta).getTime() });

async function buscar(codigo: unknown) {
  if (typeof codigo !== "string" || !/^VIP-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(codigo.trim().toUpperCase())) return null;
  const { data } = await db.from("vip_licencias").select("*").eq("codigo", codigo.trim().toUpperCase()).maybeSingle();
  return data;
}

// ---------- servidor ----------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const url = new URL(req.url);
  const cuerpo = await req.text();

  try {
    // Webhook de Stripe
    if (url.searchParams.get("accion") === "webhook") {
      if (!WEBHOOK_SECRET) return json({ error: "Cobro sin configurar" }, 503);
      const ok = await verificarFirma(cuerpo, req.headers.get("stripe-signature") ?? "", WEBHOOK_SECRET);
      if (!ok) return json({ error: "Firma no válida" }, 400);
      const evento = JSON.parse(cuerpo);
      const tipo: string = evento.type;
      if (tipo === "checkout.session.completed") {
        const s = evento.data.object;
        if (s.mode === "subscription" && s.subscription) await guardarSuscripcion(await stripe(`subscriptions/${s.subscription}`, {}, "GET"));
      } else if (tipo.startsWith("customer.subscription.")) {
        await guardarSuscripcion(evento.data.object);
      }
      return json({ recibido: true });
    }

    let datos: any = {};
    try { datos = cuerpo ? JSON.parse(cuerpo) : {}; } catch { return json({ error: "JSON no válido" }, 400); }
    const accion = datos.accion;

    if (accion === "listo") return json({ listo: cobroListo(), diasPrueba: DIAS_PRUEBA });
    if (!cobroListo()) return json({ error: "El cobro todavía no está configurado" }, 503);

    if (accion === "checkout") {
      const s = await stripe("checkout/sessions", {
        mode: "subscription",
        "line_items[0][price]": STRIPE_PRICE,
        "line_items[0][quantity]": "1",
        "subscription_data[trial_period_days]": String(DIAS_PRUEBA),
        success_url: `${SITE}/?vip=ok&sesion={CHECKOUT_SESSION_ID}`,
        cancel_url: `${SITE}/?vip=cancelado`,
        allow_promotion_codes: "true",
        locale: "es",
      });
      return json({ url: s.url });
    }

    if (accion === "recuperar") {
      if (typeof datos.sesion !== "string" || !/^cs_[A-Za-z0-9_]+$/.test(datos.sesion)) return json({ error: "Sesión no válida" }, 400);
      const s = await stripe(`checkout/sessions/${datos.sesion}`, { "expand[]": "subscription" }, "GET");
      if (s.status !== "complete" || !s.subscription) return json({ error: "El pago no está completado" }, 402);
      const codigo = await guardarSuscripcion(s.subscription);
      const { data: f } = await db.from("vip_licencias").select("*").eq("codigo", codigo).single();
      return json({ codigo, ...respuestaEstado(f) });
    }

    if (accion === "estado" || accion === "portal") {
      let f = await buscar(datos.codigo);
      if (!f) return json({ error: "Código no válido" }, 404);
      if (accion === "portal") {
        const p = await stripe("billing_portal/sessions", { customer: f.stripe_customer_id, return_url: SITE });
        return json({ url: p.url });
      }
      // cerca de caducar, se confirma con Stripe por si el webhook llegó tarde
      if (new Date(f.hasta).getTime() < Date.now() + 86400000) {
        try {
          await guardarSuscripcion(await stripe(`subscriptions/${f.stripe_subscription_id}`, {}, "GET"));
          f = await buscar(datos.codigo);
        } catch (_) { /* si Stripe no responde, se usa lo guardado */ }
      }
      return json(respuestaEstado(f));
    }

    return json({ error: "Acción desconocida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "Error del servidor" }, 500);
  }
});
