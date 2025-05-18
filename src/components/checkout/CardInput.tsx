import * as React from 'react';
import { CardElement } from '@stripe/react-stripe-js';
import { Label } from '@/components/ui/label';
import type {
  StripeCardElement,
  StripeCardElementChangeEvent,
} from '@stripe/stripe-js';

const cardStyle = {
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
};

// Create a global reference to store the card element
let globalCardElementRef: StripeCardElement | null = null;

interface CardInputProps {
  onCardElementChange?: (element: StripeCardElement | null) => void;
  onError?: (error: string | null) => void;
}

export function CardInput({ onCardElementChange, onError }: CardInputProps) {
  const [error, setError] = React.useState<string | null>(null);
  // We use elements implicitly via CardElement

  React.useEffect(() => {
    // Return the global card element if it exists
    if (globalCardElementRef && onCardElementChange) {
      onCardElementChange(globalCardElementRef);
    }

    return () => {
      // Do NOT destroy the card element on unmount
      // This is key - we preserve the element reference
    };
  }, [onCardElementChange]);

  const handleChange = (event: StripeCardElementChangeEvent) => {
    if (event.error) {
      setError(event.error.message);
      onError?.(event.error.message);
    } else {
      setError(null);
      onError?.(null);
    }
  };

  const handleReady = (element: StripeCardElement) => {
    console.log('[CardInput] Element ready');
    // Store in global ref for persistence
    globalCardElementRef = element;
    // Also pass to parent
    onCardElementChange?.(element);
  };

  return (
    <div className="space-y-2">
      <Label>Card Details</Label>
      <div
        className={`relative border rounded-md p-4 bg-white ${
          error ? 'border-red-500' : 'border-input'
        }`}
      >
        <CardElement
          options={cardStyle}
          onChange={handleChange}
          onReady={handleReady}
        />
      </div>
      {error && <div className="text-sm text-red-500 mt-1">{error}</div>}
    </div>
  );
}

// Expose function to get the global card element
export function getCardElement(): StripeCardElement | null {
  return globalCardElementRef;
}
