export type PanelSection =
  | 'reservations'
  | 'payments'
  | 'travelers'
  | 'profile'
  | 'support'
  | 'bonus'
  | 'call'
  | 'whatsapp';

export const PANEL_SECTIONS: PanelSection[] = [
  'reservations',
  'payments',
  'travelers',
  'profile',
  'support',
  'bonus',
  'call',
  'whatsapp',
];

export const PANEL_SECTION_DEFAULT: PanelSection = 'reservations';
