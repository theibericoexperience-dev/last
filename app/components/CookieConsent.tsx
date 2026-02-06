"use client";
import { useEffect, useState } from 'react';

export default function CookieConsent(){
  const [show, setShow] = useState(false);

  useEffect(()=>{
    try{ const c = document.cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('cookie_consent=')); if(!c) setShow(true); }
    catch(e){}
  },[]);

  function accept(){
    document.cookie = 'cookie_consent=yes; path=/; max-age=' + 60*60*24*365;
    setShow(false);
    window.dispatchEvent(new Event('cookie-consent-accepted'));
  }

  if(!show) return null;
  return (
    <div className="fixed bottom-2 right-2 bg-black/50 backdrop-blur-sm p-2 rounded text-white text-xs z-20 max-w-xs opacity-60 hover:opacity-80 transition-opacity" role="dialog" aria-live="polite">
      <div className="flex items-center gap-2">
        <p className="text-xs">Cookies</p>
        <button className="text-xs underline hover:no-underline" onClick={()=>setShow(false)}>✕</button>
        <button className="text-xs bg-white/20 px-1 py-0.5 rounded hover:bg-white/30 transition-colors" onClick={accept}>OK</button>
      </div>
    </div>
  );
}
