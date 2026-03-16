import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import { supabaseServer } from '@/lib/db/supabaseServer';

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

const authConfig = NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error || !data.user) {
            return null;
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Sync user profile with metadata from social provider (Google)
      if (account?.provider === 'google' && user?.email) {
        try {
          const { upsertUserProfile } = await import('@/lib/db/upsertUserProfile');

          const fullName = user.name || profile?.name || '';
          const parts = fullName.split(' ');
          const firstName = parts[0] || '';
          const lastName = parts.slice(1).join(' ') || '';

          await upsertUserProfile({
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            user_id: user.id
          }, { id: user.id });

          console.log(`>>> [NEXTAUTH CALLBACK] Profile sync successful for ${user.email}`);
        } catch (syncError) {
          console.error('>>> [NEXTAUTH CALLBACK] Profile sync failed:', syncError);
          // Don't fail the sign in if profile sync fails
        }
      }
      return true;
    },
    async session({ session, user }) {
      // Add user id to session
      if (user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
    async jwt({ token, user }) {
      // Add user id to JWT
      if (user?.id) {
        token.id = user.id;
      }
      return token;
    },
  },
});

export const { handlers, auth, signIn, signOut } = authConfig;