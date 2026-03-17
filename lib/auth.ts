import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';


export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string;
      name?: string;
      image?: string;
    };
  }
}

// Debug logs for JWT configuration

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;


if (!googleClientId || !googleClientSecret) {
  console.error('❌ ERROR: Google OAuth credentials are incomplete!');
  console.error('   - GOOGLE_CLIENT_ID from GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
  console.error('   - GOOGLE_CLIENT_ID from NEXT_PUBLIC_:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
}

if (!process.env.NEXTAUTH_SECRET) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ NEXTAUTH_SECRET is not set. NextAuth requires NEXTAUTH_SECRET to sign and verify session tokens.');
  }
}

// If NEXTAUTH_SECRET is present but short, warn in development
if (process.env.NEXTAUTH_SECRET && process.env.NODE_ENV !== 'production') {
  if ((process.env.NEXTAUTH_SECRET || '').length < 32) {
    console.warn('⚠️ NEXTAUTH_SECRET is shorter than 32 characters; consider generating a long random secret for local testing.');
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Supabase envs missing: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Skipping server-side profile sync.');
  }
}

const authConfig = NextAuth({
  basePath: '/api/auth',
  // When testing behind a proxy/tunnel (localtunnel/ngrok) we need to ensure
  // NextAuth trusts the host/proxy so cookies set by NextAuth are valid.
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  // Let NextAuth manage cookies by default. Manual cookie overrides caused
  // configuration issues in some hosting environments — remove custom cookie
  // definitions so NextAuth can pick sensible defaults for Vercel/HTTPS.
  // `secret` is the top-level option used to sign/verifiy tokens in NextAuth.
  // Allow either AUTH_SECRET or NEXTAUTH_SECRET to be provided in the env.
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId || '',
      clientSecret: googleClientSecret || '',
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && user?.email) {
          try {
            if (!supabaseUrl || !supabaseServiceRole) {
              // Supabase not configured in this environment; skip profile sync.
              if (process.env.NODE_ENV !== 'production') {
                console.warn('Skipping Supabase user_profiles upsert: missing envs.');
              }
              return true;
            }

            const supabase = createClient(
              supabaseUrl,
              supabaseServiceRole
            );

          // Buscar perfil existente
          const { data: existing } = await supabase
            .from('user_profiles')
            .select('id, metadata, roles, whatsapp_phone_e164')
            .eq('email', user.email)
            .maybeSingle();

          const fullName = user.name || profile?.name || '';
          const [firstName, ...lastNameParts] = fullName.split(' ');
          const lastName = lastNameParts.join(' ');

          const upsertPayload: Record<string, any> = {
            email: user.email,
            first_name: firstName || '',
            last_name: lastName || '',
            name: user.name || profile?.name,
            avatar_url: user.image,
            provider: account.provider,
            provider_account_id: account.providerAccountId,
            updated_at: new Date().toISOString(),
          };

          if (!existing) {
            upsertPayload.metadata = {};
            upsertPayload.roles = ['user'];
          } else {
            upsertPayload.metadata = existing.metadata;
            upsertPayload.roles = existing.roles;
            upsertPayload.whatsapp_phone_e164 = existing.whatsapp_phone_e164;
          }

          const { data: profileRow, error } = await supabase
            .from('user_profiles')
            .upsert(upsertPayload, { onConflict: 'email' })
            .select('id')
            .single();

          if (error || !profileRow) {
            console.error('Upsert user_profiles error:', error);
            return false;
          }

          (user as any)._internalProfileId = profileRow.id;
          return true;
        } catch (err) {
          console.error('SignIn sync failed:', err);
          return false;
        }
      }
      return true;
    },
    async session({ session, token }) {
      // Log token for debugging session issues in development
      try {
        // Avoid heavy serializing in production
        if (process.env.NODE_ENV !== 'production') {
          console.log('[next-auth] session callback token:', token);
        }
      } catch (e) {
        /* ignore logging errors */
      }

      // Add email and id to session from JWT token
      if (session.user) {
        session.user.id = token.sub || '';
        session.user.email = token.email || '';
      }

      try {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[next-auth] session callback session:', session?.user);
        }
      } catch (e) {
        /* ignore logging errors */
      }

      return session;
    },
    async jwt({ token, user, account }) {
      if (user && (user as any)._internalProfileId) {
        token.sub = (user as any)._internalProfileId;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // If url is relative, keep it relative to the baseUrl
      try {
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        const parsed = new URL(url);
        if (parsed.origin === baseUrl) return url;
      } catch (e) {
        // malformed url - fall through
      }
      return baseUrl;
    },
  },
});

export const { handlers, auth, signIn, signOut } = authConfig;
