"use client";

import React from 'react';
import UserBubble from './UserBubble';

export default function UserMenu({ onOpenRegisterAction }: { onOpenRegisterAction?: () => void }) {
  const [illuminate, setIlluminate] = React.useState(false);

  React.useEffect(() => {
    function onIll() {
      setIlluminate(true);
      setTimeout(() => setIlluminate(false), 4000);
    }
    if (typeof window !== 'undefined') window.addEventListener('illuminateUI', onIll);
    return () => { try { window.removeEventListener('illuminateUI', onIll); } catch (e) {} };
  }, []);

  // Render UserBubble and keep optional animate classes via a wrapper.
  // The landing page already provides the `landing-open-user-btn` id, so
  // don't duplicate it here (an empty wrapper caused a visible bordered box).
  return (
    <div className={`${illuminate ? 'illuminate illuminate-pulse' : ''}`}>
      <UserBubble onOpenRegisterAction={onOpenRegisterAction} />
    </div>
  );
}
