import PanelClient from './PanelClient';
import { auth } from '@/lib/auth';
import { TransitionLink } from '@/components/GlobalLoaderProvider';
export const dynamic = 'force-dynamic';

export default async function PanelPage() {
  // Server-side session check using NextAuth
  const session = await auth();

  if (!session?.user) {
    // SECURITY: No bypass allowed - redirect to login for unauthenticated access
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">Debes iniciar sesión para acceder al panel.</p>
        <a href="/auth/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Iniciar Sesión
        </a>
      </div>
    </div>;
  }

  // Authenticated - render the client panel which will use client hooks
  return <PanelClient />;
}
