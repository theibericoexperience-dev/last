import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = body?.phone;
    if (!phone) {
      return NextResponse.json({ error: 'phone required' }, { status: 400 });
    }

    // Stub: in production integrate with WhatsApp Business API or Twilio.
    console.log('[whatsapp invite] requested for', phone);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('whatsapp invite error', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
