'use client';

import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { panelStateFromSearchParams, updatePanelSearchParams } from './panelStateUtils';
import type { PanelSection } from '../types';

export interface UsePanelStateResult {
  activeSection: PanelSection;
  focusedOrderId: string | undefined;
  setSection: (section: PanelSection) => void;
  focusOrder: (orderId: string) => void;
  clearFocusedOrder: () => void;
}

export function usePanelState(): UsePanelStateResult {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const paramsString = searchParams?.toString() ?? '';
  const panelState = useMemo(() => panelStateFromSearchParams(searchParams), [paramsString]);

  const pushWithParams = useCallback(
    (params: URLSearchParams) => {
      const query = params.toString();
      const destination = query ? `${pathname}?${query}` : pathname;
      router.replace(destination, { scroll: false });
    },
    [pathname, router],
  );

  const setSection = useCallback(
    (section: PanelSection) => {
      const params = updatePanelSearchParams(searchParams, {
        section,
        // if switching away from reservations, clear focused order
        orderId: section === 'reservations' ? panelState.focusedOrderId : null,
      });
      pushWithParams(params);
    },
    [panelState.focusedOrderId, searchParams, pushWithParams],
  );

  const focusOrder = useCallback(
    (orderId: string) => {
      const params = updatePanelSearchParams(searchParams, { section: 'reservations', orderId });
      pushWithParams(params);
    },
    [searchParams, pushWithParams],
  );

  const clearFocusedOrder = useCallback(() => {
    const params = updatePanelSearchParams(searchParams, { orderId: null });
    pushWithParams(params);
  }, [searchParams, pushWithParams]);

  return {
    activeSection: panelState.activeSection,
    focusedOrderId: panelState.focusedOrderId ?? undefined,
    setSection,
    focusOrder,
    clearFocusedOrder,
  };
}
