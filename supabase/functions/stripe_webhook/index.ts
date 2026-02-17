import Stripe from "npm:stripe@11.19.0";
import { createClient } from "npm:@supabase/supabase-js@2.35.0";

const STRIPE_SECRET = Deno.env.get("STRIPE_API_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const stripe = new Stripe(STRIPE_SECRET, { apiVersion: "2022-11-15" });
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  global: { headers: { "x-my-function": "stripe_webhook" } },
});

Deno.serve(async (req: Request) => {
  const buf = await req.arrayBuffer();
  const body = new Uint8Array(buf);
  const signature = req.headers.get("stripe-signature") || "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    const type = event.type;

    if (type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = (session.metadata && session.metadata.orderId) ? String(session.metadata.orderId) : null;
      const sessionId = session.id;

      // Try to match by id_new (uuid) or legacy id (int) — use OR logic
      if (orderId) {
        // Try id_new (uuid) first, then legacy numeric id
        const { data: byUuid } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("id_new", orderId)
          .limit(1)
          .maybeSingle();

        let order = byUuid;

        if (!order) {
          const { data: byLegacy } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", orderId)
            .limit(1)
            .maybeSingle();
          order = byLegacy;
        }

        if (order) {
          await supabaseAdmin
            .from("orders")
            .update({ status: "paid", stripe_session_id: sessionId })
            .eq("id", order.id); // update legacy id; you may want to update id_new in future
        } else {
          console.warn("Order not found for orderId:", orderId);
        }
      } else {
        // fallback: try to find by session id
        const { data: orderBySession } = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("stripe_session_id", session.id)
            .limit(1)
            .maybeSingle();
        if (orderBySession) {
            await supabaseAdmin
            .from("orders")
            .update({ status: "paid" })
            .eq("stripe_session_id", session.id);
        } else {
            console.warn("Order not found by session id:", session.id);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });

  } catch (err) {
    console.error("Processing error:", err);
    return new Response("Error", { status: 500 });
  }
});
