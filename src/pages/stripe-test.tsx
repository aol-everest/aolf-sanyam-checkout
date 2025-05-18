import * as React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

// Initialize Stripe with the direct key
const stripePromise = loadStripe(
  'pk_test_51LnTljH6DOp7WA3cYAlemahUkCBTv94b8Cv0laMT4lnEtYShNGSScumTN0oLymu54H2b6TKzPstIaihee4pRrswn00yKstyPbS'
);

// Debugging - log Stripe initialization
console.log('Stripe promise created:', !!stripePromise);

// Simple card form component
const SimpleCardForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [cardReady, setCardReady] = React.useState(false);

  // Debug log when component mounts
  React.useEffect(() => {
    console.log(
      'SimpleCardForm mounted, stripe:',
      !!stripe,
      'elements:',
      !!elements
    );

    return () => {
      console.log('SimpleCardForm unmounting');
    };
  }, [stripe, elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not initialized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get card element
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log('Card element found:', !!cardElement);

      // Create token
      const { token, error } = await stripe.createToken(cardElement);

      if (error) {
        throw new Error(error.message);
      }

      if (!token) {
        throw new Error('No token returned');
      }

      console.log('Token created successfully:', token.id);
      setToken(token.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Payment error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-md p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
            hidePostalCode: true,
          }}
          onReady={() => {
            console.log('Card Element is ready');
            setCardReady(true);
          }}
          onChange={(e) => {
            console.log(
              'Card element change:',
              e.empty ? 'empty' : 'filled',
              e.complete ? 'complete' : 'incomplete',
              e.error ? 'has error' : 'no error'
            );
            if (e.error) {
              setError(e.error.message);
            } else {
              setError(null);
            }
          }}
          id="test-card-element"
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {token && (
        <div className="bg-green-100 p-2 rounded text-green-800">
          Token created: {token}
        </div>
      )}

      <div className="flex space-x-4">
        <Button
          type="submit"
          disabled={!stripe || !elements || loading || !cardReady}
        >
          {loading ? 'Processing...' : 'Create Token'}
        </Button>

        <div>Card element ready: {cardReady ? 'Yes' : 'No'}</div>
      </div>

      <div>
        <div>Stripe loaded: {stripe ? 'Yes' : 'No'}</div>
        <div>Elements loaded: {elements ? 'Yes' : 'No'}</div>
      </div>
    </form>
  );
};

export default function StripeTestPage() {
  const [mounted, setMounted] = React.useState(false);

  // Use client-side only rendering for Stripe
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">Stripe Element Test</h1>

        {mounted ? (
          <Elements stripe={stripePromise}>
            <SimpleCardForm />
          </Elements>
        ) : (
          <div>Loading Stripe...</div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          <p>Testing card: 4242 4242 4242 4242</p>
          <p>Expiry: Any future date</p>
          <p>CVC: Any 3 digits</p>
        </div>
      </div>
    </div>
  );
}
