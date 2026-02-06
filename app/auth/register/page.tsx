"use client";

import { Suspense } from 'react';
import RegisterInner from './RegisterInner';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  );
}
