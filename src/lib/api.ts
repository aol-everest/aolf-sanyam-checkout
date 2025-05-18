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
    question: string;
    questionType: string;
    isRequired: boolean;
  }>;
  complianceQuestionnaire?: ComplianceQuestion[];
  groupedAddOnProducts: {
    'Residential Add On': ResidentialAddOn[];
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
    addOnProducts?: {
      AddOnProductIds: string[];
    };
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
      token: string;
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

export async function submitPayment(data: {
  token: string;
  user: UserData;
  courseId: string;
  questionnaireAnswers: Record<string, string>;
}) {
  // Mock API call using the data
  console.log('Processing payment with data:', data);
  return { orderId: 'mock-order-id' };
}

export async function submitCheckout(
  workshopId: string,
  data: CheckoutPayload
): Promise<{ orderId: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/checkout/workshops/${workshopId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to process checkout');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting checkout:', error);
    throw error;
  }
}
