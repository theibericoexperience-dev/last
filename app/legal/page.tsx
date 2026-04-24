'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import LegalSection from '@/app/panel/components/LegalSection';

function LegalPageInner() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const defaultTab: 'guarantee' | 'privacy' = tab === 'privacy' ? 'privacy' : 'guarantee';
  const pageTitle = defaultTab === 'privacy' ? 'Privacy Policy' : 'Legal Information';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Back to home"
        >
          <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
        </Link>
        <span className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
          {pageTitle}
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-16">
        <LegalSection defaultTab={defaultTab} />
      </main>
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-400 text-sm">Loading…</div>
        </div>
      }
    >
      <LegalPageInner />
    </Suspense>
  );
}
