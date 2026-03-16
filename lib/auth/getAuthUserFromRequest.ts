import { auth } from '@/lib/auth';

/**
 * Extract an authenticated user id and optional metadata from the incoming Request.
 * Now using NextAuth instead of Supabase Auth.
 */
export async function getAuthUserFromRequest(request: Request): Promise<{ id: string; email?: string } | null> {
  const fake = process.env.FAKE_AUTH_USER_ID;
  if (fake && process.env.NODE_ENV === 'development') {
    return { id: fake };
  }

  try {
    // Use NextAuth to get the session
    const session = await auth();

    if (session?.user?.id) {
      console.log(`>>> [AUTH] OK via NextAuth: ${session.user.id}`);
      return {
        id: session.user.id,
        email: session.user.email
      };
    }
  } catch (err: any) {
    console.warn('>>> [AUTH] NextAuth session check failed:', err.message);
  }

  console.log('>>> [AUTH] No valid session found');
  return null;
}

