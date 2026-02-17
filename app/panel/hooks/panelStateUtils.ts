import { PanelSection, PANEL_SECTION_DEFAULT, PANEL_SECTIONS } from '../types';

interface SearchParamsLike {
  toString(): string;
  get(name: string): string | null;
}

type PanelSearchParams = SearchParamsLike | null;

export interface PanelUrlState {
  activeSection: PanelSection;
  focusedOrderId: string | undefined;
}

function normalizePanelSection(section?: string | null): PanelSection {
  if (!section) return PANEL_SECTION_DEFAULT;
  const normalized = section.trim().toLowerCase();
  // legacy mapping
  if (normalized === 'orders' || normalized === 'reservation') return 'reservations';
  if (PANEL_SECTIONS.includes(normalized as PanelSection)) return normalized as PanelSection;
  return PANEL_SECTION_DEFAULT;
}

export function panelStateFromSearchParams(searchParams: PanelSearchParams): PanelUrlState {
  const sectionParam = searchParams?.get('section');
  const rawOrderId = searchParams?.get('orderId');
  const focusedOrderId = rawOrderId && rawOrderId.trim() !== '' ? rawOrderId : undefined;
  return { activeSection: normalizePanelSection(sectionParam), focusedOrderId };
}

export function updatePanelSearchParams(
  current: PanelSearchParams,
  changes: { section?: PanelSection | null; orderId?: string | null },
): URLSearchParams {
  const params = new URLSearchParams(current?.toString?.() ?? '');

  if ('section' in changes) {
    if (changes.section === null) {
      params.delete('section');
    } else if (changes.section !== undefined) {
      // ensure it's normalized and canonical
      const normalized = normalizePanelSection(changes.section as string);
      params.set('section', normalized);
    }
  }

  if ('orderId' in changes) {
    if (changes.orderId === null) {
      params.delete('orderId');
    } else if (changes.orderId !== undefined) {
      const v = String(changes.orderId || '').trim();
      if (v === '') params.delete('orderId');
      else params.set('orderId', v);
    }
  }

  return params;
}
