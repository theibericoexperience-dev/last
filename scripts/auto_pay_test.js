// scripts/auto_pay_test.js
// Usage: node scripts/auto_pay_test.js <checkout_url>
// Attempts to complete Stripe Checkout in test mode using Playwright and test card 4242...

const { chromium } = require('playwright');

async function run(url) {
  if (!url) {
    console.error('Usage: node scripts/auto_pay_test.js <checkout_url>');
    process.exit(2);
  }
  console.log('Opening checkout URL:', url);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    console.log('Checkout page loaded, waiting for iframe...');

    // Wait for Stripe card iframe to appear
    // Try a few common iframe selectors
    const iframeSelectors = [
      'iframe[title="Secure card payment input frame"]',
      'iframe[name^="__privateStripeFrame"]',
      'iframe[src*="stripe.com/checkout"]',
      'iframe[src*="stripe.com"]'
    ];

    let frame = null;
    for (const s of iframeSelectors) {
      try {
        await page.waitForSelector(s, { timeout: 4000 });
        const elHandle = await page.$(s);
        if (elHandle) {
          const frameObj = await elHandle.contentFrame();
          if (frameObj) {
            frame = frameObj;
            console.log('Found iframe using selector', s);
            break;
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (!frame) {
      console.log('No iframe found, attempting direct selectors on page...');
    }

    // Many Checkout flows show a form after selecting payment method.
    // We'll try to fill common fields.

    // If frame exists, try to fill card inputs inside frame
    if (frame) {
      // card number
      try {
        await frame.fill('input[name="cardnumber"]', '4242424242424242', { timeout: 3000 });
      } catch (e) {
        // alternative: use keyboard
        try {
          const cardField = await frame.$('input');
          if (cardField) {
            await cardField.click();
            await page.keyboard.type('4242424242424242');
          }
        } catch (e2) {}
      }

      // expiry
      try { await frame.fill('input[name="exp-date"]', '12/34'); } catch (e) {}
      // cvc
      try { await frame.fill('input[name="cvc"]', '123'); } catch (e) {}
      // postal
      try { await frame.fill('input[name="postal"]', '12345'); } catch (e) {}
    } else {
      // Try to fill inputs on main page
      try { await page.fill('input[name="cardnumber"]', '4242424242424242', { timeout: 3000 }); } catch (e) {}
      try { await page.fill('input[name="exp-date"]', '12/34'); } catch (e) {}
      try { await page.fill('input[name="cvc"]', '123'); } catch (e) {}
      try { await page.fill('input[name="postal"]', '12345'); } catch (e) {}
    }

    // Click pay/submit button — try common labels
    const payButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("Pay")',
      'button:has-text("Pay now")',
      'button:has-text("Complete order")',
      'button:has-text("Submit")'
    ];

    for (const sel of payButtonSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn) {
          console.log('Clicking button', sel);
          await btn.click();
          break;
        }
      } catch (e) {}
    }

    // Wait for navigation to success/cancel
    try {
      await page.waitForNavigation({ waitUntil: 'load', timeout: 10000 });
      console.log('Navigation after payment detected:', page.url());
    } catch (e) {
      console.log('No navigation detected after click; waiting a bit...');
      await page.waitForTimeout(4000);
    }

    console.log('Done automating checkout — current URL:', page.url());
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Automation error', err);
    try { await browser.close(); } catch (e) {}
    process.exit(1);
  }
}

const url = process.argv[2];
run(url);
