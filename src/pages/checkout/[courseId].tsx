import { useEffect, useState } from 'react';
import ErrorPage from 'next/error';
import { FullScreenLoader } from '@/components/ui/loader';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  fetchCourse,
  fetchWorkshopAddOnInventory,
  type CourseData,
  type WorkshopAddOnInventoryResponse,
} from '@/lib/api';
import { Toaster } from '@/components/ui/toaster';
import { CheckoutFormWithStripe } from '@/components/checkout/CheckoutFormWithStripe';
import type { GetServerSideProps } from 'next';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { RECAPTCHA_SITE_KEY } from '@/config/recaptcha';
import { useToast } from '@/hooks/use-toast';

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

const CheckoutPage = ({
  course: initialCourse,
  courseId,
  addOnInventory: initialAddOnInventory,
}: {
  course?: CourseData;
  courseId: string;
  addOnInventory?: WorkshopAddOnInventoryResponse;
}): JSX.Element => {
  console.log('[CheckoutPage] Props:', {
    initialCourse,
    courseId,
    initialAddOnInventory,
  });

  const [course, setCourse] = useState<CourseData | null>(
    initialCourse || null
  );
  const [addOnInventory, setAddOnInventory] =
    useState<WorkshopAddOnInventoryResponse | null>(
      initialAddOnInventory || null
    );
  const [loading, setLoading] = useState(!initialCourse);
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

  // Client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check if all residential options are sold out or course is full
  useEffect(() => {
    // Check if course has no capacity
    if (addOnInventory?.data?._meta?.capacity?.hasCapacity === false) {
      console.log('[CheckoutPage] Course is full, no capacity available');
      setShowSoldOutDialog(true);
      setFormDisabled(true);
      return;
    }

    // Check if all add-on options are sold out
    if (addOnInventory?.data?.['Residential Add On']) {
      const options = addOnInventory.data['Residential Add On'];
      const allSoldOut = options.every((option) => option.isSoldOut);

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
        // Fallback to a default key if needed
        const fallbackKey =
          'pk_test_51LnTljH6DOp7WA3cYAlemahUkCBTv94b8Cv0laMT4lnEtYShNGSScumTN0oLymu54H2b6TKzPstIaihee4pRrswn00yKstyPbS';
        console.log('[CheckoutPage] Using fallback key');
        setStripePromise(loadStripe(fallbackKey));
      }
    }
  }, [course]);

  useEffect(() => {
    if (initialCourse) {
      console.log('[CheckoutPage] Using initial course data');
      return;
    }

    const loadCourse = async () => {
      try {
        console.log('[CheckoutPage] Fetching course data for:', courseId);
        const data = await fetchCourse(courseId);
        console.log('[CheckoutPage] Fetched course data:', data);
        setCourse(data);

        // Fetch add-on inventory after course data is loaded
        try {
          console.log(
            '[CheckoutPage] Fetching add-on inventory for:',
            courseId
          );
          const inventoryData = await fetchWorkshopAddOnInventory(courseId);
          console.log(
            '[CheckoutPage] Fetched add-on inventory:',
            inventoryData
          );
          setAddOnInventory(inventoryData);
        } catch (inventoryError) {
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
          }
        }
      } catch (error) {
        console.error('[CheckoutPage] Failed to load course:', error);

        // Check if it's a rate limit error
        if (error instanceof Error && error.name === 'RateLimitError') {
          toast({
            variant: 'destructive',
            title: 'Server Busy',
            description:
              'Our servers are handling a high number of requests. Please try again shortly.',
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
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, initialCourse, initialAddOnInventory, toast]);

  if (loading) {
    console.log('[CheckoutPage] Loading course details...');
    return <FullScreenLoader />;
  }

  if (!course) {
    console.log('[CheckoutPage] Course not found');
    return <ErrorPage statusCode={404} title="Course Not Found" />;
  }

  if (!isMounted || !stripePromise) {
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
                  ? 'We&apos;re sorry, but this course has reached full capacity and is no longer available for registration. Would you like to explore other available courses?'
                  : 'We&apos;re sorry, but all accommodation options for this course are sold out. Would you like to explore other available courses?'}
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { courseId } = context.params as { courseId: string };
  console.log('[getServerSideProps] Fetching course:', courseId);

  try {
    const course = await fetchCourse(courseId);
    console.log('[getServerSideProps] Fetched course:', course);

    // Also fetch add-on inventory data during server-side rendering
    let addOnInventory = null;
    try {
      addOnInventory = await fetchWorkshopAddOnInventory(courseId);
      console.log(
        '[getServerSideProps] Fetched add-on inventory:',
        addOnInventory
      );
    } catch (inventoryError) {
      console.error(
        '[getServerSideProps] Failed to fetch add-on inventory:',
        inventoryError
      );
    }

    return {
      props: {
        course,
        courseId,
        addOnInventory,
      },
    };
  } catch (error) {
    console.error('[getServerSideProps] Failed to fetch course:', error);
    return {
      props: {
        courseId,
      },
    };
  }
};

export default CheckoutPage;
