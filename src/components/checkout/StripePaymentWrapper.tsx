import * as React from 'react';
import { PaymentElement } from '@stripe/react-stripe-js';
import type { StripePaymentElementChangeEvent } from '@stripe/stripe-js';
import { Label } from '@/components/ui/label';

// Component that renders the Payment Element, memorized to minimize re-renders
export const StripePaymentWrapper = React.memo(() => {
  const [paymentError, setPaymentError] = React.useState<string | null>(null);

  const handlePaymentElementChange = (
    event: StripePaymentElementChangeEvent
  ) => {
    if (event.complete) {
      setPaymentError(null);
    } else if (event.empty) {
      setPaymentError(null);
    } else if (!event.complete) {
      setPaymentError(null);
    }

    console.log('Payment element change:', {
      complete: event.complete,
      empty: event.empty,
      value: event.value,
    });
  };

  return (
    <div className="space-y-2">
      <Label>Payment Information</Label>
      <div
        className={`relative border rounded-md p-4 bg-white transition-colors ${
          paymentError ? 'border-red-500' : 'border-input'
        }`}
      >
        <PaymentElement
          id="payment-element"
          options={{
            layout: 'tabs',
          }}
          onChange={handlePaymentElementChange}
        />
      </div>
      {paymentError && (
        <div className="text-sm text-red-500 mt-1">{paymentError}</div>
      )}
    </div>
  );
});

// Add display name to the component
StripePaymentWrapper.displayName = 'StripePaymentWrapper';
