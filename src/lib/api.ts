// API handlers for course and order data

export interface CourseSchedule {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  startDateTimeGMT: string;
  endDateTimeGMT: string;
  totalHours: string;
  startDateFormatted: string;
  endDateFormatted: string;
  startDateLabel: string;
  endDateLabel: string;
}

export interface CourseLocation {
  id: string;
  mode: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  street: string;
  isEmpty: boolean;
  geoLat: number;
  geoLon: number;
  center?: {
    name: string;
    email: string;
    phone1: string;
    phone2: string | null;
    additionalInfo: string | null;
    streetAddress1: string | null;
    streetAddress2: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    centerUrl: string;
    isNationalCenter: boolean;
  };
}

export interface CourseTeacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  picture: string | null;
}

export interface CoursePayment {
  publishableKey: string | null;
  isGuestCheckoutEnabled: boolean;
  partialPayment: {
    isAllowed: boolean;
    minimumAmount: number;
  };
  pricing: {
    price: {
      listPrice: number;
      unitPrice: number;
    };
    earlyBird: {
      isAllowed: boolean;
      isApplied: boolean;
      days: number;
      price: number | null;
      priceHike: number;
      isWithinEarlyBirdWindow: boolean;
    };
  };
  isPurchased: boolean;
}

export interface ResidentialAddOn {
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

export interface ComplianceQuestion {
  sfid: string;
  name: string;
  question: string;
  answerShouldBe: string;
}

export interface CourseTiming {
  id: string;
  name: string;
  timeZone: string;
  startDate: string;
  startTime: string;
  endTime: string;
  timeOfDay: string;
}

export interface CourseData {
  id: string;
  name: string;
  type: string;
  title: string;
  description: string;
  notes?: string;
  schedule: CourseSchedule;
  location: CourseLocation;
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  teachers: {
    primary: {
      id: string;
      name: string;
      email: string;
      phone: string;
      picture: string | null;
      title: string | null;
    };
    coTeacher1: {
      id: string;
      name: string;
      email: string;
      phone: string;
      picture: string | null;
      title: string | null;
    } | null;
    coTeacher2: {
      id: string;
      name: string;
      email: string;
      phone: string;
      picture: string | null;
      title: string | null;
    } | null;
  };
  payment: {
    publishableKey: string | null;
    pricing: {
      price: {
        unitPrice: number;
      };
    };
  };
  timings: CourseTiming[];
  programQuestionnaire?: Array<{
    sfid: string;
    name: string;
    question: string;
    options: string | null;
    questionType: string;
    questionCategory: string;
    isRequired: boolean;
    sequence: number;
  }>;
  complianceQuestionnaire?: ComplianceQuestion[];
  groupedAddOnProducts: {
    'Residential Add On': ResidentialAddOn[];
  };
  course?: {
    notes?: string;
    prerequisite?: string[];
    isMandatoryTypeWorkshop?: boolean;
    mandatoryWorkshopTakenRequired?: boolean;
    masterCourseType?: string;
    visibility?: string | null;
    org?: string;
    isCorporateEvent?: boolean;
    ctypeId?: string;
    childCtypeIds?: string[] | null;
    coverImage?: string;
  };
}

export interface ProgramQuestion {
  sfid: string;
  name: string;
  question: string;
  options: string[] | null;
  questionType: string;
  questionCategory: string;
  isRequired: boolean;
  sequence: number;
}

export interface UserData {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface OrderData {
  orderId: string;
  courseTitle: string;
  amount: number;
  purchasedAt: string;
  userEmail: string;
  courseDate: string;
  courseTime: string;
  instructor: string;
  location: string;
}

export interface CheckoutPayload {
  payload: {
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
    couponCode?: string;
    contactAddress: {
      phone: string;
      address: string;
      city: string;
      state: string;
      zip: string;
    };
    billingAddress: {
      phone: string;
      address: string;
      city: string;
      state: string;
      zip: string;
    };
    addOnProductIds?: string[];
    complianceQuestionnaire?: Record<string, string>;
    programQuestionnaire?: Record<string, string>;
    utm?: {
      source?: string;
      medium?: string;
      campaign?: string;
      term?: string;
      content?: string;
    };
    paymentTokenInfo: {
      id: string;
      provider: string;
      saveForFuture: boolean;
    };
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// API functions
export async function fetchCourse(courseId: string): Promise<CourseData> {
  try {
    const response = await fetch(`${API_BASE_URL}/workshops/${courseId}`);
    const data = await response.json();

    if (data.status === 'success') {
      return data.data;
    }

    throw new Error(data.message || 'Failed to fetch course');
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
}

export async function fetchOrder(orderId: string): Promise<OrderData> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch order data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching order:', error);

    // Fallback to mock data for demo/development
    return {
      orderId: orderId || 'order123',
      courseTitle: 'Art of Living Course', // Generic title
      amount: 75,
      purchasedAt: new Date().toISOString(),
      userEmail: 'test.auth@aolvecloud9.ai',
      courseDate: 'May 16, 2025',
      courseTime: '9:00 AM-11:30 AM ET',
      instructor: 'Rachel Harvey',
      location: 'Online',
    };
  }
}

export async function submitCheckout(
  workshopId: string,
  data: CheckoutPayload,
  recaptcha?: { token: string; action: string }
): Promise<{ orderId: string }> {
  try {
    // Use recaptcha from params instead of extracting from data
    const recaptchaToken = recaptcha?.token || '';
    const recaptchaAction = recaptcha?.action || '';

    // Log token details for debugging
    console.log('API submitCheckout reCAPTCHA:', {
      tokenLength: recaptchaToken?.length || 0,
      action: recaptchaAction,
      isDev: process.env.NODE_ENV === 'development',
    });

    // STRICT CHECK: Don't proceed if no recaptcha token is provided
    if (!recaptchaToken) {
      console.error('No reCAPTCHA token provided');

      // In development mode, we'll allow requests without tokens
      if (process.env.NODE_ENV !== 'development') {
        throw new Error(
          'Security verification required. Please enable reCAPTCHA and try again.'
        );
      } else {
        console.warn('Development mode: Proceeding without reCAPTCHA token');
      }
    }

    // Validate recaptcha token format before proceeding
    // A valid token is usually over 20 characters (reduced from 50 for more leniency)
    else if (recaptchaToken.length < 20) {
      console.error('Invalid reCAPTCHA token format:', {
        tokenLength: recaptchaToken.length,
      });

      // If not in development, strictly enforce reCAPTCHA
      if (process.env.NODE_ENV !== 'development') {
        throw new Error('Security verification failed. Please try again.');
      } else {
        // In development, log a warning but allow the request to proceed
        console.warn(
          'Development mode: Proceeding despite invalid reCAPTCHA token'
        );
      }
    }

    // Create headers with reCAPTCHA token
    const headers = {
      'Content-Type': 'application/json',
      'X-Recaptcha-Token': recaptchaToken,
      'X-Recaptcha-Action': recaptchaAction,
    };

    const response = await fetch(
      `${API_BASE_URL}/checkout/workshops/async/${workshopId}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process checkout');
    }

    const responseData = await response.json();

    // Extract orderId from the success response structure
    if (responseData.status === 'success' && responseData.data?.orderId) {
      return { orderId: responseData.data.orderId };
    }

    throw new Error(responseData.message || 'Failed to process checkout');
  } catch (error) {
    console.error('Error submitting checkout:', error);
    throw error;
  }
}
