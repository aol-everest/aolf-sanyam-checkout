// Stripe initialization and helpers
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

let stripePromiseInstance: Promise<Stripe | null> | null = null;

export const initializeStripe = (publishableKey: string | null) => {
  if (!publishableKey) {
    console.error('Stripe publishable key is missing');
    return null;
  }

  if (!stripePromiseInstance) {
    console.log('Initializing Stripe with key:', publishableKey);
    stripePromiseInstance = loadStripe(publishableKey);
  }

  return stripePromiseInstance;
};

export const getStripePromise = () => stripePromiseInstance;
