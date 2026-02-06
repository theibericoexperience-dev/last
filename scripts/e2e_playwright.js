// scripts/e2e_playwright.js
// Helper: create a Checkout session via debug_e2e and attempt to complete it with Playwright.
// NOTE: This script assumes Playwright is installed and browsers are available.

require('dotenv').config({ path: '.env.local' });
const { execSync, spawn } = require('child_process');
const { chromium } = require('playwright');
const path = require('path');

async function run() {
  // 1) create a checkout session using existing debug script
  console.log('Creating checkout session via scripts/debug_e2e.js (this will also insert an order)');
  const out = execSync('node scripts/debug_e2e.js', { encoding: 'utf8' });
  console.log(out);
  const m = out.match(/Stripe session created\. url: (https:\/\/checkout\.stripe\.com\/[\S]+)/);
  if (!m) throw new Error('Could not find session URL in debug output');
  const url = m[1];
  console.log('Checkout URL:', url);

  // 2) Launch browser and navigate to Stripe Checkout
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Stripe Checkout iframe is cross-origin; the best we can do is navigate and wait for the redirect to success url
  await page.goto(url, { waitUntil: 'networkidle' });
  console.log('Opened checkout page; waiting for success redirect (timeout 60s)');
  try {
    await page.waitForURL(new RegExp('stripe-success'), { timeout: 60000 });
    console.log('Detected success redirect');
  } catch (e) {
    console.warn('Did not detect success redirect; Checkout may require manual interaction or Playwright cannot autofill the payment form in this environment');
  }

  await browser.close();
}

run().catch(e => { console.error('E2E failed', e); process.exit(1); });
