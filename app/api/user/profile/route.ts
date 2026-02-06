import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import normalizeToE164 from '@/lib/phone/normalize';
import { supabaseAdmin } from '@/lib/db/supabaseServer';

// Helper to create a Supabase client for Route Handlers using @supabase/ssr
async function getSupabaseRouteClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    }
  );
}

// GET /api/user/profile - return the current user's profile row (or null)
export async function GET(request: Request) {
  const supabase = await getSupabaseRouteClient();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    const cookieHeader = request.headers.get('cookie') || 'NONE';
    console.debug('[user/profile GET] no authUser found. Error:', authError?.message);
    if (cookieHeader.includes('sb-')) {
      console.log('>>> [AUTH DEBUG] Supabase cookie detected but getUser failed:', authError);
    }
    
    return NextResponse.json({ 
      error: 'No session found in cookies',
      debug: { cookiesPresent: cookieHeader !== 'NONE' }
    }, { status: 401 });
  }

  console.debug('[user/profile GET] authUser', authUser.id, 'supabaseAdmin?', !!supabaseAdmin);
  if (!supabaseAdmin) {
    // Supabase isn't configured in this environment — return a harmless profile=null so the UI can continue.
    console.warn('[user/profile] Supabase not configured; returning empty profile');
    return NextResponse.json({ profile: null });
  }

  try {
    // Phase 1: read by session email for compatibility, but prefer id in later phases.
    // To remain non-destructive we still attempt to locate the profile row by the
    // authenticated user's id when possible (future Phase 2 will enforce id-only).
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (error) {
      // Log server-side and fall back to a null profile instead of failing the request.
      console.error('[user/profile] supabase error', error);
      return NextResponse.json({ profile: null });
    }

    // If data is null, we return a shell profile with defaults from authUser
    if (!data) {
      return NextResponse.json({ 
        profile: {
          firstName: authUser.user_metadata?.first_name || authUser.user_metadata?.full_name?.split(' ')[0] || '',
          lastName: authUser.user_metadata?.last_name || authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          email: authUser.email || '',
        } 
      });
    }

    // Merge metadata into flat structure and convert snake_case to camelCase
    const profile = {
      firstName: data.first_name || authUser.user_metadata?.first_name || '',
      lastName: data.last_name || authUser.user_metadata?.last_name || '',
      email: data.email || authUser.email || '',
      phone: data.phone || '',
      dateOfBirth: data.metadata?.dateOfBirth || '',
      nationality: data.metadata?.nationality || '',
      passportNumber: data.metadata?.passportNumber || '',
      passportExpiry: data.metadata?.passportExpiry || '',
      address: data.metadata?.address || '',
      city: data.metadata?.city || '',
      country: data.metadata?.country || '',
      postalCode: data.metadata?.postalCode || '',
      emergencyContactName: data.metadata?.emergencyContactName || '',
      emergencyContactPhone: data.metadata?.emergencyContactPhone || '',
    };

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[user/profile] unexpected error', err);
    return NextResponse.json({ profile: null });
  }
}

// PATCH /api/user/profile - upsert profile for current user
export async function PATCH(request: Request) {
  const supabase = await getSupabaseRouteClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser || !authUser.id) {
    console.debug('[user/profile PATCH] no authUser found, returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.debug('[user/profile PATCH] authUser', authUser.id, 'supabaseAdmin?', !!supabaseAdmin);
  if (!supabaseAdmin) {
    console.warn('[user/profile] Supabase not configured; PATCH will be a no-op');
    return NextResponse.json({ profile: null });
  }

  const userId = authUser.id as string;
  // Use authenticated session email as a fallback when the client doesn't send an email
  const emailFromSession = (authUser && (authUser as any).email) ? (authUser as any).email : undefined;
  const body = await request.json().catch(() => ({}));

  // Support both snake_case (legacy) and camelCase (new ProfileSection)
  const firstName = body.firstName || body.first_name;
  const lastName = body.lastName || body.last_name;
  const email = body.email ?? emailFromSession;
  const phone = body.phone;
  const dateOfBirth = body.dateOfBirth || body.date_of_birth;
  const nationality = body.nationality;
  const passportNumber = body.passportNumber || body.passport_number;
  const passportExpiry = body.passportExpiry || body.passport_expiry;
  const address = body.address;
  const city = body.city;
  const country = body.country;
  const postalCode = body.postalCode || body.postal_code;
  const emergencyContactName = body.emergencyContactName || body.emergency_contact_name;
  const emergencyContactPhone = body.emergencyContactPhone || body.emergency_contact_phone;
  const countryCode = body.countryCode || body.country_code;
  const marketingOptIn = body.marketingOptIn ?? body.marketing_opt_in;
  // WhatsApp specific fields
  const whatsappCountryCode = body.whatsappCountryCode || body.whatsapp_country_code;
  const whatsappPhone = body.whatsappPhone || body.whatsapp_phone;
  const whatsappOptIn = body.whatsappOptIn ?? body.whatsapp_opt_in;

  if (!email) {
    return NextResponse.json({ error: 'Email is required to save profile' }, { status: 400 });
  }

  const payload: Record<string, any> = {
    user_id: userId,
    first_name: firstName || null,
    last_name: lastName || null,
    email,
    phone: phone || null,
    marketing_opt_in: typeof marketingOptIn === 'boolean' ? marketingOptIn : null,
  };

  // Only include country_code when the client provided one. This avoids PostgREST
  // errors when the DB schema hasn't been updated yet.
  if (countryCode) {
    payload.country_code = countryCode;
  } else if (whatsappCountryCode) {
    // If no explicit country_code is provided but whatsappCountryCode is, use it as a fallback
    // to ensure we capture some location info.
    payload.country_code = whatsappCountryCode;
  }

  // Add extended fields if the database supports them (JSONB metadata column)
  // For now, store extended data in a metadata column if available
  const extendedData = {
    dateOfBirth: dateOfBirth || null,
    nationality: nationality || null,
    passportNumber: passportNumber || null,
    passportExpiry: passportExpiry || null,
    address: address || null,
    city: city || null,
    country: country || null,
    postalCode: postalCode || null,
    emergencyContactName: emergencyContactName || null,
    emergencyContactPhone: emergencyContactPhone || null,
  };

  // Try to add metadata column - if it doesn't exist, just use core fields
  payload.metadata = extendedData;

  // Helper: normalize phone to E.164 using provided country code.
  // normalizeToE164 available from lib

  try {
    // Use the server-side upsert helper which prefers the RPC. Pass the authenticated
    // user's id as opts.id so the RPC and DB can associate the profile to auth.users.id.
    const upsertHelper = await import('@/lib/db/upsertUserProfile');
    // If whatsappOptIn is true and phone fields provided, persist them to dedicated columns
    let whatsappE164: string | null = null;
    if (whatsappOptIn === true) {
      whatsappE164 = normalizeToE164(whatsappCountryCode, whatsappPhone);
      if (!whatsappE164) {
        return NextResponse.json({ error: 'Invalid whatsapp phone' }, { status: 400 });
      }
      // Add to payload top-level so upsertUserProfile can persist (columns are expected to exist)
      payload.whatsapp_phone_e164 = whatsappE164;
        // Backwards-compatibility: also write to a simple `whatsapp` column if present in older schemas
        payload.whatsapp = whatsappE164;
      payload.whatsapp_opt_in = true;
      payload.whatsapp_requested_at = new Date().toISOString();
    } else if (whatsappOptIn === false) {
      // explicit opt-out: set flag only
      payload.whatsapp_opt_in = false;
    }

    // Direct upsert to bypass potential RPC limitations if the new columns aren't in the RPC definition yet.
    // We use onConflict on 'user_id' which is unique in user_profiles.
    // Be defensive: if PostgREST returns PGRST204 for a missing column (schema cache mismatch),
    // remove the offending key from the payload and retry once.
    async function tryUpsert(currentPayload: Record<string, any>) {
      try {
        const { data, error } = await supabaseAdmin
          .from('user_profiles')
          .upsert({ ...currentPayload, user_id: userId }, { onConflict: 'user_id' })
          .select()
          .single();
        return { data, error };
      } catch (e: any) {
        // Supabase client may throw for certain failures; normalize to error shape
        return { data: null, error: e };
      }
    }

    // First attempt
    let attemptPayload = { ...payload };
    let { data: upsertRes, error: upsertError } = await tryUpsert(attemptPayload as any);

    if (upsertError) {
      console.error('[user/profile] upsert error (first attempt):', upsertError);
      // If PostgREST complains about a missing column in the schema cache (PGRST204),
      // parse the message and remove the column from the payload then retry once.
      const code = upsertError?.code || upsertError?.error || null;
      const msg = upsertError?.message || String(upsertError);
      const missingColMatch = /Could not find the '(.*?)' column/i.exec(msg);

      // Handle PostgREST schema cache missing-column case
      if (upsertError && (code === 'PGRST204' || /Could not find the '.*?' column/.test(msg)) && missingColMatch) {
        const missingCol = missingColMatch[1];
        console.warn(`[user/profile] PostgREST schema cache missing column '${missingCol}'. Retrying without that key.`);
        // Remove the key from the payload if present (try snake_case and camelCase variants)
        delete attemptPayload[missingCol];
        const camel = missingCol.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        delete attemptPayload[camel];

        // Retry once
        const retry = await tryUpsert(attemptPayload as any);
        upsertRes = retry.data;
        upsertError = retry.error;
        if (upsertError) {
          console.error('[user/profile] upsert error (retry):', upsertError);
        }

      // Handle duplicate-key on unique email (Postgres 23505). This happens when another
      // profile row already uses the same email but with a different user_id. To avoid
      // failing the request we strip the email and retry the upsert; the email remains
      // unchanged in the other row. We log a warning so operators can inspect and decide
      // if manual reconciliation is needed.

      } else if (upsertError && (code === '23505' || /duplicate key value violates unique constraint/.test(msg))) {
        console.warn('[user/profile] unique constraint violation during upsert (likely email).');
        // Find out if the current user already has a profile row
        try {
          const { data: existingProfile } = await supabaseAdmin
            .from('user_profiles')
            .select('user_id')
            .eq('user_id', userId)
            .maybeSingle();

          // Defensive: if profile exists, perform an UPDATE without the email field
          if (existingProfile) {
            console.warn('[user/profile] profile exists for user_id; performing UPDATE without email to avoid conflict.');
            delete attemptPayload.email;
            delete attemptPayload.email_address;
            try {
              const { data: updated, error: updateError } = await supabaseAdmin
                .from('user_profiles')
                .update({ ...attemptPayload })
                .eq('user_id', userId)
                .select()
                .single();
              upsertRes = updated;
              upsertError = updateError;
              if (upsertError) console.error('[user/profile] update error after removing email:', upsertError);
            } catch (uErr) {
              console.error('[user/profile] exception while updating profile after duplicate-email:', uErr);
              upsertError = uErr as any;
            }
          } else {
            // No profile exists for this user_id, but the email is taken by another row.
            // If the conflicting email matches the authenticated session email, assume it's an orphaned profile
            // (e.g. from a previous auth/seed) and claim it by updating the user_id to the current one.
            const sessionEmail = emailFromSession ? emailFromSession.toLowerCase() : '';
            const payloadEmail = payload.email ? payload.email.toLowerCase() : '';
            
            if (sessionEmail && payloadEmail === sessionEmail) {
               console.warn(`[user/profile] duplicate email '${sessionEmail}' matches session. claiming profile for user_id ${userId}.`);
               // Perform UPDATE on the conflicting row to steal/claim it and update fields
               const { data: claimed, error: claimError } = await supabaseAdmin
                 .from('user_profiles')
                 .update({ ...payload, user_id: userId })
                 .eq('email', payload.email) // existing row with this email
                 .select()
                 .single();
                 
               if (claimError || !claimed) {
                 console.error('[user/profile] claim failed:', claimError);
                 // Fallback to helper if claim failed (though unlikely to succeed if claim failed)
                 const fallbackRes = await upsertHelper.upsertUserProfile(payload, { id: userId });
                 if (!fallbackRes) {
                   return NextResponse.json({ error: 'Failed to upsert profile after duplicate-email' }, { status: 500 });
                 }
                 return NextResponse.json({ profile: fallbackRes });
               } else {
                 upsertRes = claimed;
                 upsertError = null;
               }
            } else {
               // Email conflict with DIFFERENT email -> reject or fallback
               console.warn('[user/profile] duplicate email mismatch (payload vs session). Delegating to helper.');
               const fallbackRes = await upsertHelper.upsertUserProfile(payload, { id: userId });
               if (!fallbackRes) {
                 return NextResponse.json({ error: 'Failed to upsert profile after duplicate-email' }, { status: 500 });
               }
               return NextResponse.json({ profile: fallbackRes });
            }
          }
        } catch (err) {
          console.error('[user/profile] error handling duplicate-email:', err);
        }

      } else {
        // Not a schema-cache missing-col error nor duplicate key — fallback to helper
        const fallbackRes = await upsertHelper.upsertUserProfile(payload, { id: userId });
        if (!fallbackRes) {
          return NextResponse.json({ error: 'Failed to upsert profile' }, { status: 500 });
        }
        return NextResponse.json({ profile: fallbackRes });
      }
    }

    if (!upsertRes) return NextResponse.json({ profile: null });

    const profileResponse = {
      ...upsertRes,
      ...(upsertRes.metadata || {}),
    };

    // No support ticket creation requested.

    return NextResponse.json({ profile: profileResponse });
  } catch (err: any) {
    console.error('[user/profile] PATCH error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save profile' }, { status: 500 });
  }
}
