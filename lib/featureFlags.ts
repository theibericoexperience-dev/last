// Simple in-repo feature flags for guarded rollout.
// Default values are safe for development; ops may override via environment variables.

export const FLAGS = {
  // Guard the new server pricing endpoint and behaviour. Default ON for dev.
  serverPricingEnabled: process.env.FEAT_SERVER_PRICING !== 'false',
};

export function isEnabled(flagName: keyof typeof FLAGS) {
  return FLAGS[flagName];
}

export default FLAGS;
