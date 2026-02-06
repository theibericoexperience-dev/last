"use client";
import { useEffect } from 'react';

export default function SentryInitClient() {
  useEffect(() => {
    // Sentry initialization via instrumentation-client removed as the file is no longer present.
    // (async () => {
    //   try {
    //     const mod = await import('../../instrumentation-client');
    //     if (mod && typeof mod.initSentryClient === 'function') {
    //       await mod.initSentryClient();
    //     }
    //   } catch (e) {
    //     console.warn('Sentry init failed', e);
    //   }
    // })();
  }, []);
  return null;
}
