import * as React from 'react';
import { useRouter } from 'next/router';
import { useStripe, useElements } from '@stripe/react-stripe-js';
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

// The Payment Element doesn't require global state as it's managed by the Elements provider

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
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const formikRef = React.useRef<FormikProps<FormikFormValues>>(null);

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

      console.log('Using Payment Element from Stripe Elements');
      console.log('Processing payment with Payment Element...');

      try {
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

              console.log(
                'Final questionnaire data with N/A values:',
                finalData
              );
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

        // Create PaymentIntent on the server
        console.log('Creating PaymentIntent on server...');
        const checkoutResult = await submitCheckout(course.id, checkoutData);

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

        // Create PaymentMethod from Elements and submit to server
        const { error: createPaymentMethodError, paymentMethod } =
          await stripe.createPaymentMethod({
            elements,
            params: {
              billing_details: {
                name: `${values.firstName} ${values.lastName}`,
                email: values.email,
                phone: values.phone,
                address: {
                  line1: values.address,
                  city: values.city,
                  state: values.state,
                  postal_code: values.zip,
                  country: 'US', // Default to US
                },
              },
            },
          });

        if (createPaymentMethodError) {
          console.error(
            'Error creating payment method:',
            createPaymentMethodError
          );
          throw new Error(
            createPaymentMethodError.message || 'Payment method creation failed'
          );
        }

        // Update the checkout payload with the payment method ID
        checkoutData.payload.paymentTokenInfo.id = paymentMethod.id;
        checkoutData.payload.paymentTokenInfo.provider =
          'stripe-payment-method';

        // Submit updated payload to server
        console.log(
          'Submitting payment with payment method ID:',
          paymentMethod.id
        );
        const finalCheckoutResult = await submitCheckout(
          course.id,
          checkoutData
        );

        if (!finalCheckoutResult.orderId) {
          throw new Error('Payment processing failed. Please try again.');
        }

        // Since we're not confirming a specific PaymentIntent, create a mock success object
        const paymentIntent = { status: 'succeeded' };

        // No confirmError check needed since we're now using createPaymentMethod

        // Ensure payment was successful
        if (paymentIntent.status !== 'succeeded') {
          console.error('Payment not successful:', paymentIntent.status);
          throw new Error(`Payment ${paymentIntent.status}. Please try again.`);
        }

        // Handle success
        toast({
          title: 'Payment Successful',
          description: 'Your registration is complete!',
        });

        console.log(
          'Payment successful, order ID:',
          finalCheckoutResult.orderId
        );

        router.push(`/thankyou/${finalCheckoutResult.orderId}`);
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
              course={course}
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
