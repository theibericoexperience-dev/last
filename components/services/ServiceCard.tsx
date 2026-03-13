"use client";
import React from 'react';

export default function ServiceCard({
  title,
  body,
  cta,
  image,
}: {
  title: string;
  body?: string;
  cta?: string;
  image?: string;
}) {
  return (
    <article className="flex flex-col bg-white rounded-2xl p-6 shadow-md border border-slate-100">
      {image && (
        <div className="w-full h-40 rounded-xl overflow-hidden mb-4 bg-slate-50">
          <img src={image} alt={title} className="object-cover w-full h-full" />
        </div>
      )}
      <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
      {body && <p className="mt-2 text-sm text-slate-600">{body}</p>}
      {cta && (
        <div className="mt-4">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full font-semibold">{cta}</button>
        </div>
      )}
    </article>
  );
}
