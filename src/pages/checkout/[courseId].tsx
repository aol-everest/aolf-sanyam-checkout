import { useEffect, useState } from 'react';
import ErrorPage from 'next/error';
import { FullScreenLoader } from '@/components/ui/loader';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  fetchCourse,
  fetchWorkshopAddOnInventory,
  type WorkshopAddOnInventoryResponse,
} from '@/lib/api';
import { Toaster } from '@/components/ui/toaster';
import { CheckoutFormWithStripe } from '@/components/checkout/CheckoutFormWithStripe';
import { useRouter } from 'next/router';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { RECAPTCHA_SITE_KEY } from '@/config/recaptcha';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Log that Stripe will be initialized with the key from API
console.log('Stripe will be initialized with key from API');

// URL to redirect users if all options are sold out
const ALL_COURSES_URL = 'https://members.us.artofliving.org/us-en/courses';

const CheckoutPage = (): JSX.Element => {
  const router = useRouter();
  const { courseId } = router.query;

  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<
    Record<string, string>
  >({});
  const [isMounted, setIsMounted] = useState(false);
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const { toast } = useToast();

  // New state for tracking if all options are sold out
  const [showSoldOutDialog, setShowSoldOutDialog] = useState(false);
  const [formDisabled, setFormDisabled] = useState(false);

  // State to track if the course is full (vs just add-ons sold out)
  const [isCourseFull, setIsCourseFull] = useState(false);

  // State for add-on inventory
  const [addOnInventory, setAddOnInventory] =
    useState<WorkshopAddOnInventoryResponse | null>(null);
  const [inventoryError, setInventoryError] = useState<Error | null>(null);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);

  // Fetch course data using React Query
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId as string),
    enabled: !!courseId,
    retry: 2,
  });

  // Fetch add-on inventory directly
  useEffect(() => {
    const getInventory = async () => {
      if (!courseId) return;

      setIsLoadingInventory(true);
      try {
        console.log(
          '[CheckoutPage] Fetching real-time inventory for:',
          courseId
        );
        const data = await fetchWorkshopAddOnInventory(courseId as string);
        setAddOnInventory(data);
      } catch (error) {
        console.error('[CheckoutPage] Inventory fetch error:', error);
        setInventoryError(
          error instanceof Error ? error : new Error(String(error))
        );
      } finally {
        setIsLoadingInventory(false);
      }
    };

    getInventory();
  }, [courseId]);

  // Client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if all residential options are sold out or course is full
  useEffect(() => {
    if (!addOnInventory) return;

    // Check if course has no capacity
    if (addOnInventory.data?._meta?.capacity?.hasCapacity === false) {
      console.log('[CheckoutPage] Course is full, no capacity available');
      setShowSoldOutDialog(true);
      setFormDisabled(true);
      return;
    }

    // Check if all add-on options are sold out
    if (addOnInventory.data?.['Residential Add On']) {
      const options = addOnInventory.data['Residential Add On'];
      const allSoldOut = options.every(
        (option: { isSoldOut: boolean }) => option.isSoldOut
      );

      console.log(
        '[CheckoutPage] Checking inventory: All sold out?',
        allSoldOut
      );

      // Show dialog and disable form if all options are sold out
      if (allSoldOut) {
        setShowSoldOutDialog(true);
        setFormDisabled(true);
      }
    }
  }, [addOnInventory]);

  // Update isCourseFull state when inventory changes
  useEffect(() => {
    setIsCourseFull(
      addOnInventory?.data?._meta?.capacity?.hasCapacity === false
    );
  }, [addOnInventory]);

  // Handle navigation to all courses
  const handleNavigateToAllCourses = () => {
    window.location.href = ALL_COURSES_URL;
  };

  // Initialize Stripe when course data is available
  useEffect(() => {
    if (course) {
      console.log('[CheckoutPage] Course payment data:', course.payment);

      // Ensure publishable key exists and initialize Stripe
      if (course.payment?.publishableKey) {
        console.log(
          '[CheckoutPage] Found publishable key:',
          course.payment.publishableKey
        );
        setStripePromise(loadStripe(course.payment.publishableKey));
      } else {
        console.error('[CheckoutPage] No publishable key found in course data');
      }
    }
  }, [course]);

  // Handle React Query errors
  useEffect(() => {
    if (courseError) {
      console.error('[CheckoutPage] Failed to load course:', courseError);

      // Check if it's a rate limit error
      if (
        courseError instanceof Error &&
        courseError.name === 'RateLimitError'
      ) {
        toast({
          variant: 'destructive',
          title: 'Server Busy',
          description:
            'Our servers are handling a high number of requests. Please try again shortly.',
        });
      } else if (
        courseError instanceof Error &&
        courseError.message.includes('network')
      ) {
        toast({
          variant: 'destructive',
          title: 'Network Error',
          description: 'Please check your internet connection and try again.',
        });
      } else {
        // Show a generic error for other issues
        toast({
          variant: 'destructive',
          title: 'Error Loading Course',
          description:
            'There was a problem loading the course details. Please refresh the page or try again later.',
        });
      }
    }

    if (inventoryError) {
      console.error(
        '[CheckoutPage] Failed to load add-on inventory:',
        inventoryError
      );

      // Check if it's a rate limit error
      if (
        inventoryError instanceof Error &&
        inventoryError.name === 'RateLimitError'
      ) {
        toast({
          variant: 'destructive',
          title: 'Server Busy',
          description:
            'Our servers are handling a high number of requests. Please try again shortly.',
        });
      } else if (
        inventoryError instanceof Error &&
        inventoryError.message.includes('network')
      ) {
        toast({
          variant: 'destructive',
          title: 'Network Error',
          description:
            'Unable to check inventory. Please check your internet connection.',
        });
      } else if (
        inventoryError instanceof Error &&
        inventoryError.message.includes('timeout')
      ) {
        toast({
          variant: 'destructive',
          title: 'Request Timeout',
          description:
            'The inventory check is taking longer than expected. Please try again.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Inventory Check Failed',
          description:
            'We were unable to verify availability. Please refresh or try again later.',
        });
      }
    }
  }, [courseError, inventoryError, toast]);

  const isLoading =
    courseLoading || !isMounted || !courseId || isLoadingInventory;

  if (isLoading) {
    console.log('[CheckoutPage] Loading course details...');
    return <FullScreenLoader />;
  }

  if (!course) {
    console.log('[CheckoutPage] Course not found');
    return <ErrorPage statusCode={404} title="Course Not Found" />;
  }

  if (!stripePromise) {
    return <FullScreenLoader />;
  }

  console.log('[CheckoutPage] Rendering checkout form with Stripe');
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
      language="en"
      useRecaptchaNet={true}
      useEnterprise={false}
      container={{
        parameters: {
          badge: 'bottomright',
          theme: 'light',
        },
      }}
    >
      <div>
        {/* Sold Out Dialog */}
        <Dialog open={showSoldOutDialog} onOpenChange={setShowSoldOutDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isCourseFull ? 'Course Full' : 'Accommodation Unavailable'}
              </DialogTitle>
              <DialogDescription>
                {isCourseFull
                  ? `We're sorry, but this course has reached full capacity and is no longer available for registration. Would you like to explore other available courses?`
                  : `We're sorry, but all accommodation options for this course are sold out. Would you like to explore other available courses?`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center mt-4">
              <Button
                onClick={handleNavigateToAllCourses}
                className="bg-[#FF9361] hover:bg-[#FF7361]"
              >
                Browse Other Courses
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Elements
          stripe={stripePromise}
          options={{
            mode: 'payment',
            amount: course?.payment?.pricing?.price?.unitPrice
              ? Math.round(course.payment.pricing.price.unitPrice * 100)
              : undefined,
            currency: 'usd',
            paymentMethodCreation: 'manual',
            fonts: [
              {
                cssSrc:
                  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
              },
            ],
            appearance: {
              theme: 'stripe',
              variables: {
                colorPrimary: '#FF9361',
                colorBackground: '#ffffff',
                colorText: '#424770',
                colorDanger: '#9e2146',
                fontFamily: 'Inter, system-ui, sans-serif',
                spacingUnit: '4px',
                borderRadius: '4px',
              },
            },
            loader: 'auto',
          }}
        >
          <div className={formDisabled ? 'opacity-50 pointer-events-none' : ''}>
            <CheckoutFormWithStripe
              course={course}
              addOnInventory={addOnInventory}
              showQuestionnaire={showQuestionnaire}
              setShowQuestionnaire={setShowQuestionnaire}
              questionnaireAnswers={questionnaireAnswers}
              setQuestionnaireAnswers={setQuestionnaireAnswers}
              disabled={formDisabled}
            />
          </div>
        </Elements>
        <Toaster />
      </div>
    </GoogleReCaptchaProvider>
  );
};

export default CheckoutPage;
