import { getServerConfig } from './config';

let cachedStripe: unknown | null | undefined;

export async function getStripeServer() {
  if (cachedStripe !== undefined) return cachedStripe;

  const cfg = getServerConfig();
  if (!cfg.stripeSecretKey) {
    cachedStripe = null;
    return cachedStripe;
  }

  const { default: Stripe } = await import('stripe');
  cachedStripe = new Stripe(cfg.stripeSecretKey);
  return cachedStripe;
}

export function getStripeWebhookSecret(): string | undefined {
  return getServerConfig().stripeWebhookSecret;
}
