import * as React from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Label } from '@/components/ui/label';
import type { Stripe, StripeElements } from '@stripe/stripe-js';

interface DirectCardElementProps {
  onReady: () => void;
  onError: (error: string | null) => void;
}

export function DirectCardElement({
  onReady,
  onError,
}: DirectCardElementProps) {
  const [cardError, setCardError] = React.useState<string | null>(null);
  const elementRef = React.useRef<HTMLDivElement>(null);
  const stripe = useStripe();
  const elements = useElements();

  // Pass errors up to parent component
  React.useEffect(() => {
    onError(cardError);
  }, [cardError, onError]);

  // Notify parent when both stripe and elements are ready
  React.useEffect(() => {
    if (stripe && elements) {
      console.log('DirectCardElement: Stripe and Elements are ready');
      onReady();
    }
  }, [stripe, elements, onReady]);

  return (
    <div className="space-y-2" ref={elementRef}>
      <Label>Card Details</Label>
      <div
        className={`relative border rounded-md p-4 bg-white ${
          cardError ? 'border-red-500' : 'border-input'
        }`}
      >
        <CardElement
          options={{
            style: {
              base: {
                color: '#424770',
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: '16px',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
                iconColor: '#9e2146',
              },
            },
            hidePostalCode: true,
          }}
          onChange={(event) => {
            console.log(
              'Card element change:',
              event.empty ? 'empty' : 'filled',
              event.complete ? 'complete' : 'incomplete',
              event.error ? `error: ${event.error.message}` : 'no error'
            );
            if (event.error) {
              setCardError(event.error.message);
            } else {
              setCardError(null);
            }
          }}
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onReady={(_element) => {
            console.log('DirectCardElement: Card element mounted and ready');
          }}
          id="direct-card-element"
        />
      </div>
      {cardError && (
        <div className="text-sm text-red-500 mt-1">{cardError}</div>
      )}
    </div>
  );
}

// Function to create a token from outside the component
export async function createCardToken() {
  try {
    // These need to be accessed from the global window
    const stripe = window.stripeInstance;
    const elements = window.stripeElements;

    if (!stripe || !elements) {
      throw new Error('Stripe not initialized globally');
    }

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      throw new Error('Card element not found or not mounted');
    }

    console.log('Creating token with direct access...');
    return await stripe.createToken(cardElement);
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}

// Define types for the global window properties
declare global {
  interface Window {
    stripeInstance: Stripe | null;
    stripeElements: StripeElements | null;
  }
}
