import { redirect } from 'next/navigation';

export default function OrdersPanelPage({ searchParams }: { searchParams?: { orderId?: string } }) {
  // Legacy route: redirect to /panel preserving orderId if present so the panel UI can show orders
  const orderId = searchParams?.orderId;
  const target = orderId ? `/panel?orderId=${encodeURIComponent(orderId)}` : '/panel';
  redirect(target);
}

