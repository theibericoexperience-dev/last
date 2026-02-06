
/**
 * NavigationIntentBus
 *
 * Centralized, domain-typed intent bus for cross-route, client-side coordination.
 *
 * RULES:
 * - This module does NOT decide anything. It only transports intents.
 * - Keep intent names namespaced by domain: "landing:*", "panel:*", "tour:*".
 * - Keep payloads JSON-serializable.
 */

export type LandingIntentName = 'landing:scrollTo';
export type PanelIntentName = 'panel:openConfirm';
export type TourIntentName = 'tour:returnToLanding' | 'tour:openReservation';

export type NavigationIntentName = LandingIntentName | PanelIntentName | TourIntentName;

export type LandingScrollToDetail = {
  id: string;
};

export type PanelOpenConfirmDetail = Record<string, never>;

export type TourReturnToLandingDetail = {
  /**
   * Optional: which landing section to restore.
   * Example: "tour-2026".
   */
  restoreSectionId?: string;
};

export type TourOpenReservationDetail = Record<string, never>;

export type NavigationIntentDetailMap = {
  'landing:scrollTo': LandingScrollToDetail;
  'panel:openConfirm': PanelOpenConfirmDetail;
  'tour:returnToLanding': TourReturnToLandingDetail;
  'tour:openReservation': TourOpenReservationDetail;
};

export type NavigationIntent<N extends NavigationIntentName = NavigationIntentName> = {
  name: N;
  detail: NavigationIntentDetailMap[N];
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.dispatchEvent === 'function';
}

/**
 * Publish an intent.
 *
 * No-op on the server.
 */
export function publishIntent<N extends NavigationIntentName>(intent: NavigationIntent<N>): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(intent.name, { detail: intent.detail }));
}

/**
 * Subscribe to an intent.
 *
 * Returns an unsubscribe function.
 */
export function subscribeIntent<N extends NavigationIntentName>(
  name: N,
  handler: (detail: NavigationIntentDetailMap[N]) => void,
): () => void {
  if (!isBrowser()) return () => {};

  const listener: EventListener = (e: Event) => {
    const detail = (e as CustomEvent).detail as NavigationIntentDetailMap[N];
    handler(detail);
  };

  window.addEventListener(name, listener);
  return () => window.removeEventListener(name, listener);
}

/** Convenience wrappers (optional). */
export function publishLandingScrollTo(id: string): void {
  publishIntent({ name: 'landing:scrollTo', detail: { id } });
}

export function subscribeLandingScrollTo(handler: (detail: LandingScrollToDetail) => void): () => void {
  return subscribeIntent('landing:scrollTo', handler);
}

export function publishPanelOpenConfirm(): void {
  publishIntent({ name: 'panel:openConfirm', detail: {} });
}

export function subscribePanelOpenConfirm(handler: () => void): () => void {
  return subscribeIntent('panel:openConfirm', () => handler());
}

export function publishTourReturnToLanding(restoreSectionId?: string): void {
  publishIntent({ name: 'tour:returnToLanding', detail: { restoreSectionId } });
}

export function subscribeTourReturnToLanding(
  handler: (detail: TourReturnToLandingDetail) => void,
): () => void {
  return subscribeIntent('tour:returnToLanding', handler);
}

export function publishTourOpenReservation(): void {
  publishIntent({ name: 'tour:openReservation', detail: {} });
}

export function subscribeTourOpenReservation(handler: () => void): () => void {
  return subscribeIntent('tour:openReservation', () => handler());
}
