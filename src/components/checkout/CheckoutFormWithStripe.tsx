import * as React from 'react';
import { useRouter } from 'next/router';
import { useStripe } from '@stripe/react-stripe-js';
import {
  Formik,
  Form,
  type FormikFormValues,
  formikValidationSchema,
  type FormikProps,
} from '@/components/ui/formik-form';
import { useToast } from '@/hooks/use-toast';
import {
  submitCheckout,
  type CourseData,
  type CheckoutPayload,
} from '@/lib/api';
import { MainContent } from '@/components/checkout/MainContent';
import { useCardElement } from '@/components/checkout/StripeCardWrapper';

// Direct access to global card state without React
const getCardState = () => {
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

// Simplified component that uses context for card element
interface CheckoutFormWithStripeProps {
  course: CourseData;
  showQuestionnaire: boolean;
  setShowQuestionnaire: (show: boolean) => void;
  questionnaireAnswers: Record<string, string>;
  setQuestionnaireAnswers: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const CheckoutFormWithStripe = ({
  course,
  showQuestionnaire,
  setShowQuestionnaire,
  questionnaireAnswers,
  setQuestionnaireAnswers,
  loading,
  setLoading,
}: CheckoutFormWithStripeProps) => {
  const stripe = useStripe();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const formikRef = React.useRef<FormikProps<FormikFormValues>>(null);

  // Access card element state from context for React rendering
  const cardContext = useCardElement();

  // Process payment with direct card element access from context
  const processPayment = async (values: FormikFormValues) => {
    if (isSubmitting) {
      return;
    }

    if (!stripe) {
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description:
          'Payment system not initialized. Please refresh and try again.',
      });
      return;
    }

    // Force validation of the card element before checking its state
    console.log('Forcing card validation before payment processing');
    cardContext.forceValidation();

    // Access direct global state for most reliable data
    const cardState = getCardState();
    console.log('Card global state after validation:', {
      hasCardElement: !!cardState.element,
      isEmpty: cardState.empty,
      isComplete: cardState.complete,
      error: cardState.error,
    });

    // Collect all errors in an array
    const errors: string[] = [];

    // Check if card element is properly initialized
    if (!cardState.element) {
      console.error('Card element is not initialized after validation');
      errors.push(
        'Card element not initialized. Please refresh and try again.'
      );
    }

    // Check for empty card
    if (cardState.empty) {
      console.log('Card is empty after validation, cannot process payment');
      errors.push('Please enter your card information.');
    }

    // Check for incomplete card
    if (!cardState.complete) {
      console.log(
        'Card is incomplete after validation, cannot process payment'
      );
      errors.push('Please complete your card information.');
    }

    // Check for card errors
    if (cardState.error) {
      console.log('Card has errors after validation:', cardState.error);
      errors.push(`Card error: ${cardState.error}`);
    }

    // Display all errors in a single toast if any
    if (errors.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: (
          <ul className="list-disc pl-5 mt-2">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        ),
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setLoading(true);

      console.log('Using card element from global state:', !!cardState.element);
      console.log('Creating token with card element...');

      try {
        // Create token using the stripe instance and card element from context
        const tokenResult = await stripe.createToken(cardState.element!);

        if (tokenResult.error) {
          console.error('Error creating token:', tokenResult.error);
          throw new Error(
            tokenResult.error.message || 'Card validation failed'
          );
        }

        if (!tokenResult.token) {
          throw new Error('Failed to process payment - no token returned');
        }

        const token = tokenResult.token;
        console.log('Token created successfully with ID:', token.id);

        // Convert compliance answers to Yes/No strings
        const complianceAnswers = Object.entries(
          values.complianceAnswers
        ).reduce((acc, [key, value]) => {
          acc[key] = value ? 'Yes' : 'No';
          return acc;
        }, {} as Record<string, string>);

        // Get program questionnaire answers (already in the right format)
        const programQuestionnaireAnswers = values.programQuestionnaire || {};

        // Create checkout payload
        const checkoutData: CheckoutPayload = {
          payload: {
            user: {
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
              phone: values.phone,
            },
            contactAddress: {
              phone: values.phone,
              address: values.address,
              city: values.city,
              state: values.state,
              zip: values.zip,
            },
            billingAddress: {
              phone: values.phone,
              address: values.address,
              city: values.city,
              state: values.state,
              zip: values.zip,
            },
            addOnProducts: values.expenseType
              ? {
                  AddOnProductIds: [values.expenseType],
                }
              : undefined,
            programQuestionnaire: {
              ...questionnaireAnswers,
              ...programQuestionnaireAnswers,
            },
            complianceQuestionnaire: complianceAnswers,
            paymentTokenInfo: {
              token: token.id,
              provider: 'stripe',
              saveForFuture: false,
            },
          },
        };

        // Submit payment
        console.log('Submitting checkout with token...');
        const checkoutResult = await submitCheckout(course.id, checkoutData);

        // Handle success
        toast({
          title: 'Payment Successful',
          description: 'Your registration is complete!',
        });

        console.log('Payment successful, order ID:', checkoutResult.orderId);

        router.push(`/thankyou/${checkoutResult.orderId}`);
      } catch (stripeError) {
        console.error('Stripe payment error:', stripeError);
        throw stripeError;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Something went wrong';
      console.error('Payment error:', errorMessage);
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (values: FormikFormValues) => {
    processPayment(values);
  };

  // Manual trigger for button click
  const handleManualSubmit = () => {
    console.log('Manual form submission requested');

    // Get current card state directly from window global
    const cardState = getCardState();
    console.log('Card global state before submission:', {
      hasCardElement: !!cardState.element,
      isCardEmpty: cardState.empty,
      isCardComplete: cardState.complete,
      cardError: cardState.error,
    });

    // Force validation with delay before submitting
    cardContext.forceValidation();

    // Submit the form after a short delay to let validation complete
    setTimeout(() => {
      // Check the global state again after validation
      const updatedCardState = getCardState();
      console.log('Card global state after validation, before submission:', {
        hasCardElement: !!updatedCardState.element,
        isCardEmpty: updatedCardState.empty,
        isCardComplete: updatedCardState.complete,
        cardError: updatedCardState.error,
      });

      if (formikRef.current) {
        // Set all fields as touched immediately to show validation errors
        const values = formikRef.current.values;

        // Touch all top-level fields
        Object.keys(values).forEach((field) => {
          formikRef.current?.setFieldTouched(field, true, false);
        });

        // Touch all compliance answer fields specifically
        if (values.complianceAnswers) {
          console.log(
            'Setting all compliance fields as touched:',
            Object.keys(values.complianceAnswers)
          );
          Object.keys(values.complianceAnswers).forEach((key) => {
            const fieldPath = `complianceAnswers.${key}`;
            formikRef.current?.setFieldTouched(fieldPath, true, false);
            console.log(`Set ${fieldPath} as touched`);
          });
        }

        // Touch all program questionnaire fields
        if (values.programQuestionnaire) {
          Object.keys(values.programQuestionnaire).forEach((key) => {
            formikRef.current?.setFieldTouched(
              `programQuestionnaire.${key}`,
              true,
              false
            );
          });
        }

        // Now validate the form
        formikRef.current.validateForm().then((errors) => {
          console.log('Formik errors:', errors);

          // Collect all error messages
          const errorMessages: string[] = [];

          // Process top-level errors
          Object.entries(errors).forEach(([field, message]) => {
            if (typeof message === 'string') {
              errorMessages.push(`${field}: ${message}`);
            }
          });

          // Process nested errors in programQuestionnaire if any
          if (
            errors.programQuestionnaire &&
            typeof errors.programQuestionnaire === 'object'
          ) {
            Object.entries(errors.programQuestionnaire).forEach(
              ([field, message]) => {
                if (typeof message === 'string') {
                  errorMessages.push(`Question ${field}: ${message}`);
                }
              }
            );
          }

          // Process nested errors in complianceAnswers if any
          if (
            errors.complianceAnswers &&
            typeof errors.complianceAnswers === 'object'
          ) {
            console.log(
              'Processing compliance errors:',
              errors.complianceAnswers
            );
            Object.entries(errors.complianceAnswers).forEach(
              ([field, message]) => {
                if (typeof message === 'string') {
                  // Get compliance question data from course if available
                  const questionData = course.complianceQuestionnaire?.find(
                    (q) => q.sfid === field
                  );
                  const questionLabel = questionData
                    ? `Compliance: ${questionData.question
                        .replace(/<[^>]*>?/gm, '')
                        .substring(0, 50)}...`
                    : `Compliance ${field}`;

                  const errorMessage = `${questionLabel}: ${message}`;
                  console.log(`Adding compliance error: ${errorMessage}`);
                  errorMessages.push(errorMessage);
                }
              }
            );
          }

          // Check for card errors separately
          if (updatedCardState.empty) {
            toast({
              variant: 'destructive',
              title: 'Payment Error',
              description: 'Please enter your card information.',
            });
            return;
          } else if (!updatedCardState.complete) {
            toast({
              variant: 'destructive',
              title: 'Payment Error',
              description: 'Please complete your card information.',
            });
            return;
          } else if (updatedCardState.error) {
            toast({
              variant: 'destructive',
              title: 'Payment Error',
              description: updatedCardState.error,
            });
            return;
          }

          // Show a single toast with all error messages
          if (errorMessages.length > 0) {
            toast({
              variant: 'destructive',
              title: 'Please fix the following errors:',
              description: (
                <ul className="list-disc pl-5 mt-2">
                  {errorMessages.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              ),
            });
            return;
          }

          // Submit after touching all fields
          formikRef.current?.submitForm();
          console.log('Form validation errors:', errors);
        });
      }
    }, 300);
  };

  return (
    <Formik
      initialValues={{
        firstName: '',
        lastName: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        expenseType: '',
        agreeTerms: false,
        complianceAnswers:
          course.complianceQuestionnaire?.reduce(
            (acc, question) => ({
              ...acc,
              [question.sfid]: false,
            }),
            {}
          ) || {},
        programQuestionnaire:
          course.programQuestionnaire?.reduce(
            (acc, question) => ({
              ...acc,
              [question.sfid]: '', // Initialize with empty string to trigger validation
            }),
            {}
          ) || {},
      }}
      validationSchema={formikValidationSchema}
      onSubmit={handleSubmit}
      innerRef={formikRef}
      validateOnMount={false}
      validateOnChange={true}
      validateOnBlur={true}
      validateOnSubmit={true}
    >
      {(formikProps: FormikProps<FormikFormValues>) => (
        <Form>
          <MainContent
            formik={{
              handleSubmit: handleManualSubmit,
              values: formikProps.values,
            }}
            showQuestionnaire={showQuestionnaire}
            setShowQuestionnaire={setShowQuestionnaire}
            onQuestionnaireSubmit={handleManualSubmit}
            loading={loading}
            course={course}
            setQuestionnaireAnswers={setQuestionnaireAnswers}
          />
        </Form>
      )}
    </Formik>
  );
};
