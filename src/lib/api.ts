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
  productGroup: string | null;
  isResidentialAddOn: boolean;
  isExpenseAddOn: boolean;
  isCMEAddOn: boolean;
  paymentMode: string | null;
  totalInventoryItems: number;
  isAddOnSelectionRequired: boolean;
  useOnlyForBackendRegistration: boolean;
  priceBookEntryId: string;
  unitPrice: number;
  isFull: boolean;
  totalAvailableQuantity: number;
  inventoryUsed: number;
  inventoryRemaining: number | null;
  isSoldOut: boolean;
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

export interface WorkshopAddOnInventoryResponse {
  status: string;
  data: {
    'Residential Add On': ResidentialAddOn[];
    Ungrouped: ResidentialAddOn[];
    _meta: {
      capacity: {
        hasCapacity: boolean;
        remaining: number | null;
        total: number | null;
        current: number;
      };
    };
  };
  message: string;
  meta: {
    uptime: number;
    timestamp: string;
    environment: string;
    responseTime: string;
    isCachedResult: boolean;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Helper function to handle API errors consistently
export function handleApiError(error: {
  status?: number;
  code?: string;
  message?: string;
  [key: string]: unknown;
}): never {
  console.error('API error:', error);

  // Check if this is a rate limit error (HTTP 429)
  if (
    error.status === 429 ||
    (error.code && error.code === 'RATE_LIMIT_EXCEEDED')
  ) {
    const rateLimitError = new Error(
      'Server busy - please try again in a few moments'
    );
    rateLimitError.name = 'RateLimitError';
    // Attach original error data for reference
    (
      rateLimitError as unknown as { originalError: typeof error }
    ).originalError = error;
    throw rateLimitError;
  }

  // Just rethrow the original error
  throw error;
}

// API functions
export async function fetchCourse(courseId: string): Promise<CourseData> {
  try {
    const response = await fetch(`${API_BASE_URL}/workshops/${courseId}`);
    const data = await response.json();

    // Check for rate limit error in the response
    if (data.code === 'RATE_LIMIT_EXCEEDED') {
      return handleApiError({
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message:
          data.message ||
          'Our servers are currently handling a high number of requests. Please try again shortly.',
      });
    }

    if (data.status === 'success') {
      return data.data;
    }

    throw new Error(data.message || 'Failed to fetch course');
  } catch (error) {
    console.error('Error fetching course:', error);

    // Check if it's already a handled error (from handleApiError)
    if (error instanceof Error && error.name === 'RateLimitError') {
      throw error;
    }

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
      courseTitle: 'Art of Living Course - Sanyam 2', // Generic title
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
  recaptchaToken?: string | null,
  recaptchaAction?: string
): Promise<{ orderId: string; clientSecret?: string }> {
  try {
    // Create headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add recaptcha token and action to headers if available
    if (recaptchaToken) {
      headers['X-Recaptcha-Token'] = recaptchaToken;
    }

    if (recaptchaAction) {
      headers['X-Recaptcha-Action'] = recaptchaAction;
    }

    // If using PaymentIntent, update endpoint
    const endpoint = `${API_BASE_URL}/checkout/workshops/async/${workshopId}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process checkout');
    }

    const responseData = await response.json();

    if (responseData.status === 'success') {
      // Check if we have paymentIntent in the response
      if (responseData.data.paymentIntent?.client_secret) {
        return {
          orderId: responseData.data.orderId,
          clientSecret: responseData.data.paymentIntent.client_secret,
        };
      } else {
        // Fallback for legacy response format
        return {
          orderId: responseData.data.orderId,
          clientSecret: responseData.data.clientSecret,
        };
      }
    }

    throw new Error(responseData.message || 'Failed to process checkout');
  } catch (error) {
    console.error('Error submitting checkout:', error);
    throw error;
  }
}

export async function fetchWorkshopAddOnInventory(
  workshopId: string
): Promise<WorkshopAddOnInventoryResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/workshops/add-on-inventory/${workshopId}`
    );
    const data = await response.json();

    // Check for rate limit error in the response
    if (data.code === 'RATE_LIMIT_EXCEEDED') {
      return handleApiError({
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message:
          data.message ||
          'Our servers are currently handling a high number of requests. Please try again shortly.',
      });
    }

    if (data.status === 'success') {
      return data;
    }

    throw new Error(
      data.message || 'Failed to fetch workshop add-on inventory'
    );
  } catch (error) {
    console.error('Error fetching workshop add-on inventory:', error);

    // Check if it's already a handled error (from handleApiError)
    if (error instanceof Error && error.name === 'RateLimitError') {
      throw error;
    }

    throw error;
  }
}
