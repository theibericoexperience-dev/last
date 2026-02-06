import { notFound } from 'next/navigation';

export default function YearRoute() {
  // Behind should be modal-only; year routes are archived.
  return notFound();
}

