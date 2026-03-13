"use client";
import React from 'react';
import ServicesPanelDesktop from './ServicesPanelDesktop';
import ServicesPanelMobile from './ServicesPanelMobile';

export default function ServicesPanelWrapper({
  onCloseAction,
  onSwitchToToursAction,
  onRequireAuthAction,
  onOpenPackageAction,
}: {
  onCloseAction?: () => void;
  onSwitchToToursAction?: () => void;
  onRequireAuthAction?: () => void;
  onOpenPackageAction?: () => void;
}) {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (ev: MediaQueryListEvent | MediaQueryList) => setIsDesktop((ev as MediaQueryList).matches);
    setIsDesktop(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange as EventListener);
    else mq.addListener(onChange as any);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange as EventListener);
      else mq.removeListener(onChange as any);
    };
  }, []);

  return isDesktop ? (
    <ServicesPanelDesktop
      onCloseAction={onCloseAction}
      onSwitchToToursAction={onSwitchToToursAction}
      onRequireAuthAction={onRequireAuthAction}
      onOpenPackageAction={onOpenPackageAction}
    />
  ) : (
    <ServicesPanelMobile
      onCloseAction={onCloseAction}
      onSwitchToToursAction={onSwitchToToursAction}
      onRequireAuthAction={onRequireAuthAction}
      onOpenPackageAction={onOpenPackageAction}
    />
  );
}
