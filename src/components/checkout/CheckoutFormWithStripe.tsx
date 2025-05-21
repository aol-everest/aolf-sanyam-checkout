import * as React from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import type { StripeError } from '@stripe/stripe-js';
import { FullScreenLoader } from '@/components/ui/loader';
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
  type WorkshopAddOnInventoryResponse,
} from '@/lib/api';
import { MainContent } from '@/components/checkout/MainContent';
import { useRecaptcha } from '@/hooks/use-recaptcha';

// Define the interface here instead of importing it
interface ResidentialAddOnProduct {
  sfid: string;
  name: string;
  productGroup: string;
  isResidentialAddOn: boolean;
  isExpenseAddOn: boolean;
  isCMEAddOn: boolean;
  paymentMode: string;
  totalInventoryItems: number;
  isAddOnSelectionRequired: boolean;
  useOnlyForBackendRegistration: boolean;
  priceBookEntryId: string;
  unitPrice: number;
  isFull: boolean;
  totalAvailableQuantity: number;
}

// Simplified component that uses context for card element
interface CheckoutFormWithStripeProps {
  course: CourseData;
  addOnInventory?: WorkshopAddOnInventoryResponse | null;
  showQuestionnaire: boolean;
  setShowQuestionnaire: (show: boolean) => void;
  questionnaireAnswers: Record<string, string>;
  setQuestionnaireAnswers: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  disabled?: boolean;
}

export const CheckoutFormWithStripe = ({
  course,
  addOnInventory,
  showQuestionnaire,
  setShowQuestionnaire,
  questionnaireAnswers,
  setQuestionnaireAnswers,
  disabled = false,
}: CheckoutFormWithStripeProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const formikRef = React.useRef<FormikProps<FormikFormValues>>(null);
  const { getRecaptchaToken } = useRecaptcha();

  // Process payment with Payment Element
  const processPayment = async (values: FormikFormValues) => {
    if (isSubmitting) {
      return;
    }

    // Set loading state to show the loader
    setLoading(true);

    // Trim all string values in the form data
    const trimmedValues = { ...values };
    Object.keys(trimmedValues).forEach((key) => {
      const value = trimmedValues[key as keyof FormikFormValues];
      if (typeof value === 'string') {
        (trimmedValues as Record<string, unknown>)[key] = value.trim();
      }
    });

    // Use trimmedValues instead of original values
    values = trimmedValues as FormikFormValues;

    if (!stripe || !elements) {
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description:
          'Payment system not initialized. Please refresh and try again.',
      });
      setLoading(false);
      return;
    }

    console.log('Validating payment element before processing payment');

    const { error: elementsError } = await elements.submit();
    if (elementsError) {
      console.error('Payment Element validation error:', elementsError);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description:
          elementsError.message || 'Please check your payment details.',
      });
      setLoading(false);
      return;
    }

    try {
      setIsSubmitting(true);

      // Convert compliance answers to Yes/No strings
      const complianceAnswers = Object.entries(values.complianceAnswers).reduce(
        (acc, [key, value]) => {
          acc[key] = value ? 'Yes' : 'No';
          return acc;
        },
        {} as Record<string, string>
      );

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
            // Prioritize values from questionnaireAnswers (most recent)
            // but fall back to programQuestionnaireAnswers if needed
            const mergedData = {
              ...programQuestionnaireAnswers, // Start with formik values
              ...questionnaireAnswers, // Override with state values (most recent)
            };

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

            console.log('Final questionnaire data with N/A values:', finalData);
            return finalData;
          })(),
          complianceQuestionnaire: complianceAnswers,
          paymentTokenInfo: {
            id: 'payment_intent', // This is a placeholder, server will create the PaymentIntent
            provider: 'stripe-payment-intent',
            saveForFuture: false,
          },
        },
      };

      // Get reCAPTCHA token
      const recaptchaAction = 'checkout_submit';
      const recaptchaResult = await getRecaptchaToken(recaptchaAction);

      if (!recaptchaResult.token) {
        console.warn(
          'Could not obtain reCAPTCHA token, proceeding without it',
          recaptchaResult.error
        );
        toast({
          variant: 'destructive',
          title: 'Security Verification Issue',
          description:
            recaptchaResult.error?.message ||
            'We were unable to verify your request. You may continue, but the checkout might be rejected.',
        });
      }

      // Create PaymentIntent on the server
      console.log('Creating PaymentIntent on server...');
      const checkoutResult = await submitCheckout(
        course.id,
        checkoutData,
        recaptchaResult.token,
        recaptchaAction
      ).catch((error) => {
        console.error('Server checkout error:', error);

        // Check if error is related to reCAPTCHA
        if (
          error.message &&
          (error.message.toLowerCase().includes('recaptcha') ||
            error.message.toLowerCase().includes('captcha') ||
            error.message.toLowerCase().includes('verification'))
        ) {
          toast({
            variant: 'destructive',
            title: 'Security Verification Failed',
            description:
              'Your request could not be verified. Please try again or contact support if the issue persists.',
          });
        }

        // Handle payment service high traffic error (500)
        if (
          error.status === 500 &&
          error.message &&
          error.message.includes(
            'payment service provider is currently experiencing high traffic'
          )
        ) {
          toast({
            variant: 'destructive',
            title: 'Payment Service Busy',
            description:
              'Our payment service is currently experiencing high traffic. Please wait a moment and try again.',
          });
          throw new Error('Payment service busy - please try again shortly');
        }

        // Handle rate limit error (429)
        if (
          error.status === 429 ||
          (error.code && error.code === 'RATE_LIMIT_EXCEEDED')
        ) {
          toast({
            variant: 'destructive',
            title: 'Server Busy',
            description:
              error.message ||
              'Our servers are currently handling a high number of requests. Please wait a moment and try again.',
          });
          throw new Error('Server busy - please try again in a few moments');
        }

        throw new Error(
          error.message || 'Failed to process checkout. Please try again.'
        );
      });

      // Ensure we have the client secret from the PaymentIntent
      if (!checkoutResult.clientSecret) {
        console.error('No client secret returned from server');
        console.log('Server response:', checkoutResult);
        throw new Error('Failed to create payment - please try again.');
      }

      console.log('Client secret received successfully');
      console.log(
        'PaymentIntent created with orderId:',
        checkoutResult.orderId
      );

      const result = await stripe.confirmPayment({
        elements,
        clientSecret: checkoutResult.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/thankyou/${checkoutResult.orderId}`,
        },
      });

      if (result.error) {
        // Handle specific Stripe errors with custom messages
        const errorMessage = getStripeErrorMessage(result.error);
        console.error('Stripe payment error:', result.error);
        throw new Error(errorMessage);
      }

      // Handle success
      toast({
        title: 'Payment Successful',
        description: 'Your registration is complete!',
      });
    } catch (err) {
      let errorMessage = 'Something went wrong with your payment';

      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }

      // Log the full error for debugging
      console.error('Payment error:', err);

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

  // Helper function to provide better error messages for Stripe errors
  const getStripeErrorMessage = (error: StripeError): string => {
    switch (error.type) {
      case 'card_error':
        return error.message || 'Your card was declined';
      case 'validation_error':
        return 'Please check your payment details';
      case 'invalid_request_error':
        return 'We were unable to process your payment request';
      case 'authentication_error':
        return 'Authentication with the payment system failed';
      case 'rate_limit_error':
        return 'Too many payment attempts. Please try again later';
      case 'api_error':
      case 'api_connection_error':
        return 'We cannot connect to our payment system right now. Please try again later';
      default:
        return error.message || 'There was an issue processing your payment';
    }
  };

  // Handle form submission
  const handleSubmit = async (values: FormikFormValues) => {
    // Trim all string values in the form data
    const trimmedValues = { ...values };
    Object.keys(trimmedValues).forEach((key) => {
      const value = trimmedValues[key as keyof FormikFormValues];
      if (typeof value === 'string') {
        (trimmedValues as Record<string, unknown>)[key] = value.trim();
      }
    });

    // Use trimmedValues instead of original values
    values = trimmedValues as FormikFormValues;

    // Proceed directly with payment
    await processPayment(values);
  };

  // Manual trigger for button click
  const handleManualSubmit = async () => {
    // Get current form values from Formik
    if (!formikRef.current) {
      console.error('Formik ref is not available');
      return;
    }

    if (!stripe || !elements) {
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description:
          'Payment system not initialized. Please refresh and try again.',
      });
      return;
    }

    // Verify reCAPTCHA before form submission
    const recaptchaAction = 'checkout';
    const recaptchaResult = await getRecaptchaToken(recaptchaAction);

    if (!recaptchaResult.token) {
      console.warn(
        'reCAPTCHA verification failed during form submission',
        recaptchaResult.error
      );
      toast({
        variant: 'destructive',
        title: 'Security Verification Failed',
        description:
          recaptchaResult.error?.message ||
          'We were unable to verify this form submission. Try again or contact support if the issue persists.',
      });
      // Continue with submission but warn the user
    }

    // Set loading state to show the loader
    setLoading(true);

    // Get values and touch all fields
    const values = formikRef.current.values;

    // Trim all string values in the form data
    const trimmedValues = { ...values };
    Object.keys(trimmedValues).forEach((key) => {
      const value = trimmedValues[key as keyof FormikFormValues];
      if (typeof value === 'string') {
        (trimmedValues as Record<string, unknown>)[key] = value.trim();
      }
    });

    // Update form values with trimmed values
    Object.keys(trimmedValues).forEach((key) => {
      if (typeof trimmedValues[key as keyof FormikFormValues] === 'string') {
        formikRef.current?.setFieldValue(
          key,
          (trimmedValues as Record<string, unknown>)[key]
        );
      }
    });

    // Validate the Payment Element
    console.log('Validating payment element before form submission');
    const { error: elementsError } = await elements.submit();

    if (elementsError) {
      console.error('Payment Element validation error:', elementsError);
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description:
          elementsError.message || 'Please check your payment details.',
      });
      setLoading(false);
      return;
    }

    console.log('Payment element validated successfully');

    if (formikRef.current) {
      // Set all fields as touched immediately to show validation errors
      const values = formikRef.current.values;

      // Touch all top-level fields
      Object.keys(values).forEach((field) => {
        formikRef.current?.setFieldTouched(field, true, false);
      });

      // Touch all compliance answer fields specifically
      if (values.complianceAnswers) {
        Object.keys(values.complianceAnswers).forEach((key) => {
          const fieldPath = `complianceAnswers.${key}`;
          formikRef.current?.setFieldTouched(fieldPath, true, false);
        });
      }

      // Touch all program questionnaire fields
      if (values.programQuestionnaire) {
        Object.keys(values.programQuestionnaire).forEach((key) => {
          const fieldPath = `programQuestionnaire.${key}`;
          formikRef.current?.setFieldTouched(fieldPath, true, false);
        });
      }

      // Now validate the form
      formikRef.current
        .validateForm()
        .then((errors: Record<string, unknown>) => {
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
                  errorMessages.push(errorMessage);
                }
              }
            );
          }

          // Show a single toast with all error messages
          if (errorMessages.length > 0) {
            setLoading(false);
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
  };

  return (
    <>
      {loading && <FullScreenLoader />}
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
              course={
                course as CourseData & {
                  groupedAddOnProducts: {
                    'Residential Add On': ResidentialAddOnProduct[];
                  };
                }
              }
              setQuestionnaireAnswers={setQuestionnaireAnswers}
              addOnInventory={addOnInventory}
              disabled={disabled}
            />
          </Form>
        )}
      </Formik>
    </>
  );
};
