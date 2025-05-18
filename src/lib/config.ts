// Configuration variables

export const config = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.artofliving.org',
  stripePublicKey:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder',
};

export default config;
