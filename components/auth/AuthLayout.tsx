"use client";

import React from 'react';
import Link from 'next/link';
import { getSupabaseUrl } from '@/lib/media-resolver';

export type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  helperText?: string;
  helperAction?: {
    label: string;
    href: string;
  };
  sidebar?: {
    eyebrow?: string;
    heading?: string;
    copy?: string;
    bullets?: string[];
    photoUrl?: string;
  };
};

const DEFAULT_SIDEBAR = {
  eyebrow: 'THE IBERO WAY',
  heading: 'A dedicated travel panel just for you',
  copy:
    'Plan, confirm and revisit every detail of your tour — from traveler profiles to deposits and private calls with our concierge.',
  bullets: [
    'Keep traveler cards, special diets and medical notes in one safe place.',
    'Track deposits and upgrades, then continue payments when you are ready.',
    'Book a call with our team any time you want a more human touch.',
  ],
  photoUrl: getSupabaseUrl('LANDING/THUMBNAIL.JPG'),
};

export default function AuthLayout({
  title,
  subtitle,
  children,
  helperText,
  helperAction,
  sidebar,
}: AuthLayoutProps) {
  const side = { ...DEFAULT_SIDEBAR, ...(sidebar || {}) };
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* Left / visual copy */}
        <div className="relative hidden overflow-hidden rounded-br-[56px] rounded-tr-[56px] border border-white/20 bg-slate-900 lg:flex">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(2,0,24,0.35) 0%, rgba(2,0,12,0.8) 60%), url('${side.photoUrl}')`,
            }}
          />
          <div className="relative z-10 flex flex-col items-start justify-end gap-6 p-12 text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs tracking-[0.3em] uppercase text-white/80">
              {side.eyebrow}
            </div>
            <div>
              <h2 className="text-4xl font-semibold leading-tight drop-shadow-lg">{side.heading}</h2>
              {side.copy && <p className="mt-4 max-w-lg text-base text-white/80">{side.copy}</p>}
            </div>
            {side.bullets && side.bullets.length > 0 && (
              <ul className="space-y-3 text-white/85">
                {side.bullets.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm leading-relaxed">
                    <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-white/70" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-white/20 pt-4 text-sm text-white/70">
              Need assistance right away?{' '}
              <Link href="mailto:tours@ibero.world" className="underline decoration-white/40 underline-offset-4">
                tours@ibero.world
              </Link>
            </div>
          </div>
        </div>

        {/* Right / form */}
        <div className="flex w-full items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/95 p-8 shadow-2xl shadow-indigo-100">
            <div className="mb-8 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-indigo-500">Ibero Concierge</p>
              <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
              <p className="text-base text-slate-600">{subtitle}</p>
            </div>

            <div className="space-y-6">{children}</div>

            {helperText && (
              <div className="mt-8 text-center text-sm text-slate-500">
                {helperText}{' '}
                {helperAction && (
                  <Link href={helperAction.href} className="font-semibold text-slate-900 underline-offset-4 hover:underline">
                    {helperAction.label}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
