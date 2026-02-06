const PANEL_SECTIONS = ['reservations','payments','travelers','profile','support','bonus','call','whatsapp'];
const PANEL_SECTION_DEFAULT = 'reservations';

function normalizePanelSection(section){
  if (!section) return PANEL_SECTION_DEFAULT;
  const normalized = String(section).trim().toLowerCase();
  if (normalized === 'orders') return 'reservations';
  if (PANEL_SECTIONS.includes(normalized)) return normalized;
  return PANEL_SECTION_DEFAULT;
}

function panelStateFromSearchParams(searchParams){
  if (!searchParams) return { activeSection: PANEL_SECTION_DEFAULT, focusedOrderId: undefined };
  const sectionParam = typeof searchParams.get === 'function' ? searchParams.get('section') : null;
  const rawOrderId = typeof searchParams.get === 'function' ? searchParams.get('orderId') : null;
  const focusedOrderId = rawOrderId && String(rawOrderId).trim() !== '' ? rawOrderId : undefined;
  return { activeSection: normalizePanelSection(sectionParam), focusedOrderId };
}

function updatePanelSearchParams(current, changes){
  const params = new URLSearchParams(typeof current?.toString === 'function' ? current.toString() : '');

  if ('section' in changes) {
    if (changes.section === null) params.delete('section');
    else if (changes.section !== undefined) {
      const normalized = normalizePanelSection(changes.section);
      params.set('section', normalized);
    }
  }

  if ('orderId' in changes) {
    if (changes.orderId === null) params.delete('orderId');
    else if (changes.orderId !== undefined) {
      const v = (changes.orderId || '').trim();
      if (v === '') params.delete('orderId');
      else params.set('orderId', v);
    }
  }

  return params;
}

module.exports = {
  PANEL_SECTIONS,
  PANEL_SECTION_DEFAULT,
  panelStateFromSearchParams,
  updatePanelSearchParams,
};
