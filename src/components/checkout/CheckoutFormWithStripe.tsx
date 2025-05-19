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
import { useGoogleReCaptcha } from '@google-recaptcha/react';

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

  // Use Google reCAPTCHA hook
  const { executeV3 } = useGoogleReCaptcha();

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

    // Verify with reCAPTCHA first
    if (!executeV3) {
      console.error('reCAPTCHA not available');

      // In development, we'll allow proceeding even without reCAPTCHA
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'Development mode: Proceeding without reCAPTCHA verification'
        );
      } else {
        toast({
          variant: 'destructive',
          title: 'Verification Error',
          description:
            'Security verification service is not available. Please refresh and try again.',
        });
        return;
      }
    }

    // Store recaptcha token for later use
    let recaptchaToken = '';
    let isRecaptchaValid = false;

    try {
      if (executeV3) {
        // Execute reCAPTCHA with action name
        recaptchaToken = await executeV3('checkout');
        console.log('reCAPTCHA token received:', {
          length: recaptchaToken?.length || 0,
          first10Chars: recaptchaToken?.substring(0, 10) || '',
        });

        if (!recaptchaToken) {
          console.warn('Empty reCAPTCHA token received');

          // Only block in production
          if (process.env.NODE_ENV !== 'development') {
            toast({
              variant: 'destructive',
              title: 'Verification Failed',
              description:
                'Security verification failed. Please try again later.',
            });
            return;
          }
        }

        // Check if reCAPTCHA token is valid (not just empty)
        // For localhost, reCAPTCHA might return a token even if domain is not valid
        isRecaptchaValid = Boolean(
          recaptchaToken && recaptchaToken.length > 20
        );

        // In development environment on localhost, we can detect invalid tokens
        // by checking the token format or length
        if (!isRecaptchaValid) {
          console.warn(
            'reCAPTCHA validation suspicious - token may be invalid',
            {
              tokenLength: recaptchaToken?.length || 0,
              isDev: process.env.NODE_ENV === 'development',
            }
          );

          // For strict environments, uncomment this to block checkout on invalid tokens
          // Even in development mode, we should prevent requests with invalid tokens
          if (process.env.NODE_ENV !== 'development') {
            toast({
              variant: 'destructive',
              title: 'Security Check Failed',
              description:
                'Domain verification failed. Please ensure you are accessing from an authorized domain.',
            });
            return;
          } else {
            // In development mode, continue despite invalid token
            console.log(
              'Development mode: Continuing with checkout despite invalid reCAPTCHA token'
            );
          }
        } else {
          console.log('reCAPTCHA verification successful');
        }
      } else if (process.env.NODE_ENV === 'development') {
        // In development, create a mock token when reCAPTCHA is not available
        console.log('Development mode: Creating mock reCAPTCHA token');
        recaptchaToken = 'dev_mode_mock_token_' + Date.now();
      }
    } catch (recaptchaError) {
      console.error('reCAPTCHA error:', recaptchaError);

      // Only block in production
      if (process.env.NODE_ENV !== 'development') {
        toast({
          variant: 'destructive',
          title: 'Verification Error',
          description: 'Security verification failed. Please try again later.',
        });
        return;
      } else {
        console.warn('Development mode: Proceeding despite reCAPTCHA error');
      }
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
            addOnProductIds: values.expenseType
              ? [values.expenseType]
              : undefined,
            programQuestionnaire: (() => {
              console.log(
                'questionnaireAnswers from state:',
                questionnaireAnswers
              );
              console.log(
                'programQuestionnaireAnswers from formik:',
                programQuestionnaireAnswers
              );

              // Prioritize values from questionnaireAnswers (most recent)
              // but fall back to programQuestionnaireAnswers if needed
              const mergedData = {
                ...programQuestionnaireAnswers, // Start with formik values
                ...questionnaireAnswers, // Override with state values (most recent)
              };
              console.log(
                'Merged questionnaire data before filtering:',
                mergedData
              );

              // Fix for backend: Send "N/A" instead of empty strings
              // This ensures the backend knows we've processed this question
              const finalData = Object.entries(mergedData).reduce(
                (acc, [key, value]) => {
                  // Replace empty strings with "N/A" to ensure data is sent
                  acc[key] = value && value.trim() !== '' ? value : 'N/A';
                  return acc;
                },
                {} as Record<string, string>
              );

              console.log(
                'Final questionnaire data with N/A values:',
                finalData
              );
              return finalData;
            })(),
            complianceQuestionnaire: complianceAnswers,
            paymentTokenInfo: {
              id: token.id,
              provider: 'stripe',
              saveForFuture: false,
            },
          },
        };

        // Ensure we have a valid reCAPTCHA token before submitting
        const tokenToSubmit = recaptchaToken || values.recaptchaToken || '';
        if (!tokenToSubmit) {
          console.error('Cannot submit payment: No reCAPTCHA token available');
          throw new Error(
            'Security verification required. Please enable reCAPTCHA and try again.'
          );
        }

        // Submit payment - pass recaptcha as separate parameter
        console.log('Submitting checkout with token...');
        const checkoutResult = await submitCheckout(course.id, checkoutData, {
          token: tokenToSubmit,
          action: values.recaptchaAction || 'checkout',
        });

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
    // Make sure the form has a reCAPTCHA token
    if (!values.recaptchaToken && executeV3) {
      // If there's no token in the form but we have the reCAPTCHA API available,
      // capture a token before proceeding with payment
      executeV3('form_submit')
        .then((token) => {
          if (token) {
            // Update form values with the new token
            if (formikRef.current) {
              formikRef.current.setFieldValue('recaptchaToken', token);
              formikRef.current.setFieldValue('recaptchaAction', 'form_submit');

              // Now proceed with payment with the updated values
              const updatedValues = {
                ...values,
                recaptchaToken: token,
                recaptchaAction: 'form_submit',
              };
              processPayment(updatedValues);
            } else {
              processPayment(values);
            }
          } else {
            // If no token could be obtained, still try to process anyway
            // The server will reject if reCAPTCHA is strictly required
            processPayment(values);
          }
        })
        .catch((error) => {
          console.error(
            'Failed to get reCAPTCHA token for form submit:',
            error
          );
          // Still try to process payment even if reCAPTCHA fails
          // The server will enforce reCAPTCHA if required
          processPayment(values);
        });
    } else {
      // If we already have a token or reCAPTCHA isn't available, proceed directly
      processPayment(values);
    }
  };

  // Manual trigger for button click
  const handleManualSubmit = async () => {
    console.log('Manual form submission requested');

    // Verify with reCAPTCHA first on manual submit
    if (!executeV3) {
      // Mandatory reCAPTCHA check - don't allow submission without reCAPTCHA
      console.error('reCAPTCHA verification not available');

      // In development, allow proceeding without reCAPTCHA
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'Development mode: Proceeding without reCAPTCHA for manual submit'
        );
      } else {
        toast({
          variant: 'destructive',
          title: 'Security Verification Required',
          description:
            'This site requires security verification to process your checkout. Please enable reCAPTCHA and try again.',
        });
        return;
      }
    }

    let recaptchaToken = '';

    if (executeV3) {
      try {
        // Store token in form ref so it can be used during form submission
        recaptchaToken = await executeV3('checkout_button');
        console.log('Manual submit reCAPTCHA token:', {
          length: recaptchaToken?.length || 0,
          first10Chars: recaptchaToken?.substring(0, 10) || '',
        });

        // Strict validation - must have token to proceed
        if (!recaptchaToken) {
          console.warn('Empty reCAPTCHA token received on manual submit');

          // Only block in production
          if (process.env.NODE_ENV !== 'development') {
            toast({
              variant: 'destructive',
              title: 'Verification Failed',
              description: 'Security verification failed. Please try again.',
            });
            return;
          }
        }

        // Check token validity - use lower threshold (20 chars) for development
        if (recaptchaToken.length < 20) {
          console.warn('reCAPTCHA token may be invalid on manual submit:', {
            tokenLength: recaptchaToken?.length || 0,
          });

          // Block submission for invalid tokens in production only
          if (process.env.NODE_ENV !== 'development') {
            toast({
              variant: 'destructive',
              title: 'Security Verification Failed',
              description:
                'Invalid verification token. Please ensure you are accessing from an authorized domain.',
            });
            return;
          } else {
            console.log(
              'Development mode: Allowing manual submission with suspect reCAPTCHA token'
            );
          }
        }

        console.log('reCAPTCHA verification successful on manual submit');

        // Store token in a hidden field or in formikRef for use during submission
        if (formikRef.current) {
          // Create a recaptcha field in the form values if it doesn't exist
          formikRef.current.setFieldValue('recaptchaToken', recaptchaToken);
          formikRef.current.setFieldValue('recaptchaAction', 'checkout_button');
        }
      } catch (recaptchaError) {
        console.error('reCAPTCHA error on manual submit:', recaptchaError);

        // Only block in production
        if (process.env.NODE_ENV !== 'development') {
          toast({
            variant: 'destructive',
            title: 'Verification Error',
            description: 'Security verification failed. Please try again.',
          });
          return;
        } else {
          console.warn(
            'Development mode: Proceeding with manual submit despite reCAPTCHA error'
          );
        }
      }
    } else if (process.env.NODE_ENV === 'development') {
      // In development, create a mock token when reCAPTCHA is not available
      console.log(
        'Development mode: Creating mock reCAPTCHA token for manual submit'
      );
      recaptchaToken = 'dev_mode_mock_token_manual_' + Date.now();

      // Store the mock token
      if (formikRef.current) {
        formikRef.current.setFieldValue('recaptchaToken', recaptchaToken);
        formikRef.current.setFieldValue(
          'recaptchaAction',
          'checkout_button_mock'
        );
      }
    }

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
          console.log(
            'Setting all program questionnaire fields as touched:',
            Object.keys(values.programQuestionnaire)
          );
          Object.keys(values.programQuestionnaire).forEach((key) => {
            const fieldPath = `programQuestionnaire.${key}`;
            formikRef.current?.setFieldTouched(fieldPath, true, false);
            console.log(`Set ${fieldPath} as touched`);
          });
        }

        // Now validate the form
        formikRef.current
          .validateForm()
          .then((errors: Record<string, unknown>) => {
            console.log('Formik errors:', errors);
            console.log(
              'Program questionnaire values:',
              values.programQuestionnaire
            );

            // Skip validation for programQuestionnaire as it's handled separately
            // in the ProgramQuestionnaire component
            if (errors.programQuestionnaire) {
              delete errors.programQuestionnaire;
            }

            // Collect all error messages
            const errorMessages: string[] = [];

            // Process top-level errors
            Object.entries(errors).forEach(([field, message]) => {
              if (typeof message === 'string') {
                errorMessages.push(`${field}: ${message}`);
              }
            });

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
        recaptchaToken: '', // Initialize reCAPTCHA token field
        recaptchaAction: '', // Initialize reCAPTCHA action field
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
