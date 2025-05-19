import { useEffect, useState } from 'react';
import ErrorPage from 'next/error';
import { FullScreenLoader } from '@/components/ui/loader';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { fetchCourse, type CourseData } from '@/lib/api';
import { Toaster } from '@/components/ui/toaster';
import { CheckoutFormWithStripe } from '@/components/checkout/CheckoutFormWithStripe';
import type { GetServerSideProps } from 'next';

// Log that Stripe will be initialized with the key from API
console.log('Stripe will be initialized with key from API');

const CheckoutPage = ({
  course: initialCourse,
  courseId,
}: {
  course?: CourseData;
  courseId: string;
}): JSX.Element => {
  console.log('[CheckoutPage] Props:', { initialCourse, courseId });

  const [course, setCourse] = useState<CourseData | null>(
    initialCourse || null
  );
  const [loading, setLoading] = useState(!initialCourse);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<
    Record<string, string>
  >({});
  const [isMounted, setIsMounted] = useState(false);
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);

  // Client-side only rendering
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      } catch (error) {
        console.error('[CheckoutPage] Failed to load course:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, initialCourse]);

  if (loading) {
    console.log('[CheckoutPage] Loading course details...');
    return <FullScreenLoader message="Loading course details..." />;
  }

  if (!course) {
    console.log('[CheckoutPage] Course not found');
    return <ErrorPage statusCode={404} title="Course Not Found" />;
  }

  if (!isMounted || !stripePromise) {
    return <FullScreenLoader message="Initializing payment system..." />;
  }

  console.log('[CheckoutPage] Rendering checkout form with Stripe');
  return (
    <div className="min-h-screen bg-gray-50">
      <Elements
        stripe={stripePromise}
        options={{
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900 font-inter">
              {course.title}
            </h1>
          </div>
          {/* StripeCardWrapper is already inside the main content */}
          <CheckoutFormWithStripe
            course={course}
            showQuestionnaire={showQuestionnaire}
            setShowQuestionnaire={setShowQuestionnaire}
            questionnaireAnswers={questionnaireAnswers}
            setQuestionnaireAnswers={setQuestionnaireAnswers}
            loading={loading}
            setLoading={setLoading}
          />
        </div>
      </Elements>
      <Toaster />
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { courseId } = context.params as { courseId: string };
  console.log('[getServerSideProps] Fetching course:', courseId);

  try {
    const course = await fetchCourse(courseId);
    console.log('[getServerSideProps] Fetched course:', course);
    return {
      props: {
        course,
        courseId,
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
