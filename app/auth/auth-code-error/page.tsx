'use client';

import Link from 'next/link';

export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Error de Autenticación</h1>
      <p className="text-xl text-gray-600 mb-8">
        Hubo un problema al procesar tu acceso. Esto puede deberse a un enlace caducado o inválido.
      </p>
      <div className="flex gap-4">
        <Link 
          href="/"
          className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          Volver al Inicio
        </Link>
        <Link 
          href="/auth/login"
          className="border border-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Intentar de nuevo
        </Link>
      </div>
    </div>
  );
}
