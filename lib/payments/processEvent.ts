export async function processStripeEvent(event: any) {
  const { getSupabaseServer } = await import('@/lib/server/supabase');
  const { getStripeServer } = await import('@/lib/server/stripe');
  const supabaseServer = getSupabaseServer();
  if (!supabaseServer) throw new Error('supabaseServer not configured');

  // Idempotency: check if event_id already marked processed
  let existing: any = null;
  try {
    const { data, error: exErr } = await supabaseServer.from('raw_events').select('*').eq('event_id', event.id).limit(1).maybeSingle();
    if (exErr) console.warn('[processor] error checking raw_events', exErr.message || exErr);
    existing = data;
    if (existing && existing.processed) {
      console.log('[processor] event already processed', event.id);
      return { skipped: true };
    }
  } catch (e) {
    console.warn('[processor] error during idempotency check', e?.message || e);
  }

  // store/update raw_events row
  try {
    const up = await supabaseServer.from('raw_events').upsert({ event_id: event.id, event_type: event.type, payload: event }).select('*');
    if (up.error) console.warn('[processor] upsert raw_events error', up.error.message || up.error);
  } catch (e) {
    console.warn('[processor] failed to upsert raw_events', e?.message || e);
  }

  // handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any;
    const orderId = session.metadata?.orderId;
    console.log(`>>> PROCESANDO PAGO PARA ORDEN: ${orderId || 'DESCONOCIDA'} (Session: ${session.id})`);

    try {
      // Intentar actualizar por ID (de metadatos) o por stripe_session_id
      let query = supabaseServer.from('orders').update({ status: 'paid' });
      
      if (orderId) {
        // Updated to support String UUIDs or Legacy Integer IDs
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId));
        console.log(`>>> BUSCANDO POR ID (UUID/INT): ${orderId}`);
        
        if (isUuid) {
           // Look in both id (if migrated) or id_new (future)
           query = query.or(`id.eq.${orderId},id_new.eq.${orderId}`);
        } else {
           // Fallback for legacy
           query = query.eq('id', String(orderId));
        }
      } else {
        query = query.eq('stripe_session_id', session.id);
      }

      const { data: updated, error: updErr } = await query.select('*');
      
      if (updErr) {
        console.error('>>> ERROR AL ACTUALIZAR ORDEN:', updErr.message);
        throw updErr;
      }
      
      console.log(`>>> ORDEN(ES) ACTUALIZADA(S):`, updated?.length || 0);

      // if there's a payment_intent on the session, try to fetch details and insert a payment row idempotently
      const piId = (session.payment_intent as string) || null;
      if (piId) {
        try {
          // check if we've already recorded this payment_intent
          const { data: existingPayments } = await supabaseServer.from('payments').select('*').eq('stripe_payment_intent_id', piId).limit(1).maybeSingle();
          if (!existingPayments) {
            // retrieve PI from Stripe
            const stripeClient = (await getStripeServer()) as any;
            if (!stripeClient) throw new Error('stripe not configured');
            const pi = await stripeClient.paymentIntents.retrieve(piId as string);
            await supabaseServer.from('payments').insert({ stripe_payment_intent_id: pi.id, amount: pi.amount, currency: pi.currency, status: pi.status, raw: pi });
          } else {
            console.log('[processor] payment_intent already recorded', piId);
          }
        } catch (e) {
          console.warn('[processor] could not retrieve/insert payment_intent', e?.message || e);
        }
      }

      // mark processed
      await supabaseServer.from('raw_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('event_id', event.id);
      return { updatedCount: Array.isArray(updated) ? updated.length : (updated ? 1 : 0) };
    } catch (e) {
      // record error and increment attempt count
      try {
        await supabaseServer.from('raw_events').update({ last_error: (e?.message || e).toString(), attempt_count: (existing?.attempt_count || 0) + 1 }).eq('event_id', event.id);
      } catch (uerr) {
        console.warn('[processor] failed to record processing error', uerr?.message || uerr);
      }
      throw e;
    }
  }

  // fallback: mark processed but unhandled
  try {
    await supabaseServer.from('raw_events').update({ processed: true, processed_at: new Date().toISOString() }).eq('event_id', event.id);
  } catch (e) {
    console.warn('[processor] failed to mark raw event processed', e?.message || e);
  }
  return { handled: false };
}
