"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function MobileFullScreen() {
  const pathname = usePathname() || '';
  // Do not request fullscreen in the panel — it breaks the viewport on iOS
  const isPanel = pathname.startsWith('/panel');

  useEffect(() => {
    if (isPanel) return;
    const handleInteraction = async () => {
       if (window.innerWidth < 768 && !document.fullscreenElement) {
          try {
            await document.documentElement.requestFullscreen();
          } catch (err) {
            // Fullscreen is not supported in all iOS browsers — ignore silently
          }
       }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    
    return () => {
       window.removeEventListener('click', handleInteraction);
       window.removeEventListener('touchstart', handleInteraction);
    };
  }, [isPanel]);

  return null;
}