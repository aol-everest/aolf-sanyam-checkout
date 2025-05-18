import * as React from 'react';
import { CardElement } from '@stripe/react-stripe-js';
import type {
  StripeCardElement,
  StripeCardElementChangeEvent,
} from '@stripe/stripe-js';
import { Label } from '@/components/ui/label';

// Use window to truly persist this reference
declare global {
  interface Window {
    __STRIPE_CARD_ELEMENT__: {
      element: StripeCardElement | null;
      complete: boolean;
      empty: boolean;
      error: string | null;
    };
  }
}

// Initialize global storage if it doesn't exist
if (typeof window !== 'undefined' && !window.__STRIPE_CARD_ELEMENT__) {
  window.__STRIPE_CARD_ELEMENT__ = {
    element: null,
    complete: false,
    empty: true,
    error: null,
  };
}

// Helper to get the global card state
const getGlobalCardState = () => {
  if (typeof window === 'undefined') {
    return {
      element: null,
      complete: false,
      empty: true,
      error: null,
    };
  }
  return window.__STRIPE_CARD_ELEMENT__;
};

// Helper to update the global card state
const updateGlobalCardState = (
  updates: Partial<typeof window.__STRIPE_CARD_ELEMENT__>
) => {
  if (typeof window !== 'undefined') {
    window.__STRIPE_CARD_ELEMENT__ = {
      ...window.__STRIPE_CARD_ELEMENT__,
      ...updates,
    };
  }
};

// Create a context to share the card element reference
export const CardElementContext = React.createContext<{
  cardElement: StripeCardElement | null;
  cardComplete: boolean;
  cardError: string | null;
  cardEmpty: boolean;
  forceValidation: () => void;
}>({
  cardElement: null,
  cardComplete: false,
  cardError: null,
  cardEmpty: true,
  forceValidation: () => {},
});

export const useCardElement = () => React.useContext(CardElementContext);

// Component that renders only the card element, memorized to minimize re-renders
export const StripeCardWrapper: React.FC = React.memo(() => {
  // Use global state for initial values
  const globalState = getGlobalCardState();
  const [cardError, setCardError] = React.useState<string | null>(
    globalState.error
  );
  const [cardComplete, setCardComplete] = React.useState<boolean>(
    globalState.complete
  );
  const [cardEmpty, setCardEmpty] = React.useState<boolean>(globalState.empty);
  const [validated, setValidated] = React.useState(false);
  const cardContainerRef = React.useRef<HTMLDivElement>(null);

  const handleCardElementChange = (event: StripeCardElementChangeEvent) => {
    console.log(
      'Card element change:',
      event.empty ? 'empty' : 'filled',
      event.complete ? 'complete' : 'incomplete',
      event.error ? `error: ${event.error.message}` : 'no error'
    );

    // Update both global state and component state
    updateGlobalCardState({
      empty: event.empty,
      complete: event.complete,
      error: event.error ? event.error.message : null,
    });

    // Update UI state
    setCardEmpty(event.empty);
    setCardComplete(event.complete);
    setValidated(true);

    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  const handleCardElementReady = (element: StripeCardElement) => {
    console.log('Card element ready and mounted');

    // Store in global state
    updateGlobalCardState({ element });
    console.log('Card element reference saved globally', !!element);

    // Force a blur/focus to ensure we get proper state
    setTimeout(() => {
      try {
        element.focus();
        setTimeout(() => element.blur(), 100);
      } catch (err) {
        console.error('Failed to trigger element focus/blur:', err);
      }
    }, 500);
  };

  const forceValidation = () => {
    // Use the global element reference
    const element = getGlobalCardState().element;
    if (element) {
      console.log('Forcing card validation check with element:', !!element);
      try {
        element.focus();
        setTimeout(() => element.blur(), 100);
      } catch (err) {
        console.error('Failed to force validation:', err);
      }
    } else {
      console.warn('No card element available for validation');
    }
  };

  // If we haven't validated yet and have a card element, force validation on mount
  React.useEffect(() => {
    const element = getGlobalCardState().element;
    if (element && !validated) {
      forceValidation();
    }

    // Cleanup - don't actually destroy the element reference
    return () => {
      console.log(
        'StripeCardWrapper unmounting, preserving card element reference'
      );
    };
  }, [validated]);

  // Handle clicking on the card container to focus the card element
  const handleContainerClick = () => {
    const element = getGlobalCardState().element;
    if (element) {
      element.focus();
    }
  };

  // Create a stable context value that always checks the global state
  const getContextValue = React.useCallback(() => {
    const globalState = getGlobalCardState();
    return {
      cardElement: globalState.element,
      cardComplete: globalState.complete,
      cardError: globalState.error,
      cardEmpty: globalState.empty,
      forceValidation,
    };
  }, []);

  return (
    <CardElementContext.Provider value={getContextValue()}>
      <div className="space-y-2">
        <Label>Card Details</Label>
        <div
          ref={cardContainerRef}
          onClick={handleContainerClick}
          className={`relative border rounded-md p-4 bg-white transition-colors cursor-text ${
            cardError
              ? 'border-red-500'
              : cardComplete
              ? 'border-green-500'
              : cardEmpty
              ? 'border-input'
              : 'border-yellow-400'
          }`}
        >
          <CardElement
            id="stable-card-element"
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
            onChange={handleCardElementChange}
            onReady={handleCardElementReady}
          />
          {!cardError && (
            <div className="text-xs mt-1">
              {cardComplete
                ? '✅ Card information complete'
                : cardEmpty
                ? 'Please enter your card information'
                : 'Please complete your card information'}
            </div>
          )}
        </div>
        {cardError && (
          <div className="text-sm text-red-500 mt-1">{cardError}</div>
        )}
      </div>
    </CardElementContext.Provider>
  );
});

StripeCardWrapper.displayName = 'StripeCardWrapper';
