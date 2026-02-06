// app/layout.tsx
import React from "react";
import "./globals.css";
import CookieConsent from './components/CookieConsent';
import SentryInitClient from './components/SentryInitClient';
import { NotificationProvider } from '../components/NotificationProvider';
import UserBubble from '../components/UserBubble';

  const title = 'Ibero Tours — Authentic travels across Spain & Portugal';
  const description = 'Authentic small-group travels focused on local food, culture and nature across Spain and Portugal.';
  const siteUrl = 'https://agencia-viajes2.vercel.app';
  const ogImage = '/_optimized/og-default-w1200.webp';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Ibero Tours" />
  <meta property="og:url" content={siteUrl} />
  <meta property="og:image" content={`${siteUrl}${ogImage}`} />
  <link rel="canonical" href={siteUrl} />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Kalam:wght@300;400;700&display=swap" rel="stylesheet" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <link rel="icon" href="/favicon.ico" />
        <style dangerouslySetInnerHTML={{ __html: `
    body { background: #000; margin: 0; }
    /* Only force full-viewport positioning for the intended background video elements.
       This prevents modal or inline videos from being pinned full-screen. */
    video.video-background, video#inkVideo {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      object-fit: cover;
      z-index: 0;
    }
  ` }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "TravelAgency",
          "name": "Ibero Tours",
          "url": siteUrl,
          "description": description,
          "sameAs": [
            "https://www.facebook.com/your-page",
            "https://www.instagram.com/your-page"
          ]
        }) }} />
      </head>
      <body>
        {/* Global top/bottom separators: thin black bands across the viewport */}
        {/* Rounded rectangle frame: four joined thin lines with rounded corners */}
        {/* decorative frame removed to avoid covering the hero video */}
        {/* layout header and body content (skip link and debug server marker removed) */}
        <NotificationProvider>
          {children}
          <UserBubble />
        </NotificationProvider>
        <CookieConsent />
        <script dangerouslySetInnerHTML={{ __html: `(function(){
          function loadGA(){
            var id = window.__NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || '${process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || ''}';
            if(!id) return;
            if(document.querySelector('[data-ga]')) return;
            var s = document.createElement('script'); s.src = 'https://www.googletagmanager.com/gtag/js?id='+id; s.async = true; s.setAttribute('data-ga', '1'); document.head.appendChild(s);
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);} window.gtag = gtag; gtag('js', new Date()); gtag('config', id);
          }
          if(document.cookie.indexOf('cookie_consent=yes') !== -1) loadGA();
          window.addEventListener('cookie-consent-accepted', loadGA);
        })();`}} />

        {/* Client-side diagnostics instrumentation: capture console errors, runtime errors, unhandled rejections and network failures and POST to /api/diagnostic (best-effort).
            This instrumentation is noisy and was added for debugging; restrict it to development builds only so
            production behavior and telemetry remain minimal.
        */}
        {String(process.env.NEXT_PUBLIC_ENABLE_DIAGNOSTIC).toLowerCase() === 'true' && (
          <script dangerouslySetInnerHTML={{ __html: `(function(){
          try{
            // toggle via env var: set NEXT_PUBLIC_ENABLE_DIAGNOSTIC=true to enable client POSTs
            var DIAGNOSTIC_ENABLED = true;
          }catch(e){}

          try{
            function sendDiagnostic(payload){
              try{
                if(!DIAGNOSTIC_ENABLED) return;
                var data = JSON.stringify(Object.assign({ ts: Date.now() }, payload));
                // try sendBeacon first for reliability during unload
                if(navigator && typeof navigator.sendBeacon === 'function'){
                  try{ navigator.sendBeacon('/api/diagnostic', data); return; }catch(e){}
                }
                // Note: this is a debug-only exception to the "no direct /api fetch in UI" rule.
                // It's intentionally kept inline to avoid bundling extra client code for diagnostics.
                fetch('/api/diagnostic', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: data }).catch(function(){});
              }catch(e){}
            }

            // wrap console methods of interest
            ['error','warn','info'].forEach(function(level){
              var orig = console[level];
              console[level] = function(){
                try{
                  var args = Array.prototype.slice.call(arguments).map(function(a){ try{ return typeof a === 'string' ? a : JSON.stringify(a); }catch(e){ return String(a); }}).join(' ');
                  sendDiagnostic({ level: level, message: args, source: 'console' });
                }catch(e){}
                try{ orig && orig.apply(console, arguments); }catch(e){}
              };
            });

            // capture runtime errors (including resource load errors via capture)
            window.addEventListener('error', function(ev){
              try{
                var isResource = ev.target && ev.target !== window;
                if(isResource){
                  var tag = ev.target.tagName;
                  var src = ev.target.src || ev.target.href || null;
                  sendDiagnostic({ level: 'error', message: 'resource-error', meta: { tag: tag, src: src } });
                } else {
                  sendDiagnostic({ level: 'error', message: ev.message || 'runtime-error', meta: { filename: ev.filename, lineno: ev.lineno, colno: ev.colno, error: (ev.error && ev.error.stack) || ev.error } });
                }
              }catch(e){}
            }, true);

            window.addEventListener('unhandledrejection', function(ev){
              try{
                var reason = ev && ev.reason ? (ev.reason.stack || (typeof ev.reason === 'string' ? ev.reason : JSON.stringify(ev.reason))) : 'unhandledrejection';
                sendDiagnostic({ level: 'error', message: 'unhandledrejection', meta: { reason: reason } });
              }catch(e){}
            });

            // wrap fetch to capture network failures and non-ok responses (best-effort)
            if(window.fetch){
              var _fetch = window.fetch.bind(window);
              window.fetch = function(){
                try{
                  var args = arguments;
                  return _fetch.apply(null, args).then(function(resp){
                    try{
                      if(!resp.ok){
                        sendDiagnostic({ level: 'warn', message: 'fetch-non-ok', meta: { url: resp.url, status: resp.status } });
                      }
                    }catch(e){}
                    return resp;
                  }).catch(function(err){
                    try{ sendDiagnostic({ level: 'error', message: 'fetch-error', meta: { err: String(err), args: args && args[0] } }); }catch(e){}
                    throw err;
                  });
                }catch(e){ try{ return _fetch.apply(null, arguments); }catch(e2){ return Promise.reject(e2); } }
              };
            }
            }catch(e){}
          })();`}} />
        )}

        <SentryInitClient />
        <script dangerouslySetInnerHTML={{ __html: `(function(){
          // Dispatch a custom event after 5 seconds so UI elements can draw attention
          try{
            var started = false;
            function fire(){ if(started) return; started = true; try{ window.dispatchEvent(new Event('illuminateUI')); }catch(e){}
              try{
                // add peak classes to landing buttons, then keep subtle illuminate afterwards
                var ids = ['landing-open-map-btn','landing-open-user-btn'];
                ids.forEach(function(id){ try{ var el = document.getElementById(id); if(el){ el.classList.add('illuminate','illuminate-peak','illuminate-peak-pulse');
                      // after peak animation (4s) remove peak classes but keep subtle illuminate
                      setTimeout(function(){ try{ el.classList.remove('illuminate-peak','illuminate-peak-pulse'); el.classList.add('illuminate'); }catch(e){} }, 4000);
                    } }catch(e){} });
              }catch(e){}
            }
            if(document.readyState === 'complete' || document.readyState === 'interactive') setTimeout(fire, 4000);
            else window.addEventListener('DOMContentLoaded', function(){ setTimeout(fire, 4000); });
          }catch(e){}
        })();`}} />
      </body>
    </html>
  );
}
