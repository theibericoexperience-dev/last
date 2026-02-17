import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');
    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing url query parameter' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    // Fetch remote resource server-side (avoids CORS issues on client)
    const remote = await fetch(url);
    if (!remote.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch remote resource' }), { status: 502, headers: { 'content-type': 'application/json' } });
    }

    const contentType = remote.headers.get('content-type') || 'application/octet-stream';
    // Derive a filename from the URL
    let filename = url.split('/').pop() || 'download';
    try { filename = decodeURIComponent(filename); } catch (e) { /* ignore */ }

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Cache-Control', 'no-store');
    // Allow same-origin clients to fetch this (route is same origin); CORS not strictly necessary but harmless
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(remote.body, { status: 200, headers });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}

export const runtime = 'edge';
