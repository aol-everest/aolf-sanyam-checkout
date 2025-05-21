import * as React from 'react';
import {
  FormField,
  FormItem,
  FormMessage,
  FormikFormValues,
  FormFieldProps,
} from '@/components/ui/formik-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { US_STATES } from '@/components/checkout/constants';
import type { CourseData, WorkshopAddOnInventoryResponse } from '@/lib/api';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Checkbox } from '@/components/ui/checkbox';
// Import the StripePaymentWrapper for the payment form
import { StripePaymentWrapper } from '@/components/checkout/StripePaymentWrapper';
import { ProgramQuestionnaire } from '@/components/checkout/ProgramQuestionnaire';

export interface ResidentialAddOnProduct {
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

interface MainContentProps {
  formik: {
    handleSubmit: () => void;
    values: FormikFormValues;
    setFieldError?: (field: string, message: string) => void;
    setFieldTouched?: (
      field: string,
      isTouched: boolean,
      shouldValidate?: boolean
    ) => void;
    setFieldValue?: (
      field: string,
      value: unknown,
      shouldValidate?: boolean
    ) => void;
  };
  showQuestionnaire: boolean;
  setShowQuestionnaire: (show: boolean) => void;
  onQuestionnaireSubmit: (values: FormikFormValues) => void | Promise<void>;
  loading: boolean;
  course: CourseData & {
    groupedAddOnProducts: {
      'Residential Add On': ResidentialAddOnProduct[];
    };
  };
  addOnInventory?: WorkshopAddOnInventoryResponse | null;
  setQuestionnaireAnswers: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  disabled?: boolean;
}

// Helper function to format time
const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes}${ampm}`;
};

// Helper function to format date range
const formatDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startMonth = start.toLocaleString('en-US', { month: 'long' });
  const endMonth = end.toLocaleString('en-US', { month: 'long' });
  const startDay = start.getDate();
  const endDay = end.getDate();
  const year = start.getFullYear();

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay}-${endMonth} ${endDay}, ${year}`;
};

export const MainContent = ({
  formik,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  showQuestionnaire: _showQuestionnaire,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  setShowQuestionnaire: _setShowQuestionnaire,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  onQuestionnaireSubmit: _onQuestionnaireSubmit,
  loading,
  course,
  addOnInventory,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  setQuestionnaireAnswers: _setQuestionnaireAnswers,
  disabled = false,
}: MainContentProps) => {
  const coursePrice = course.payment?.pricing?.price?.unitPrice || 0;

  // Use add-on inventory data when available
  React.useEffect(() => {
    if (addOnInventory) {
      console.log(
        '[MainContent] Using workshop add-on inventory data:',
        addOnInventory
      );

      // Here you could update component state based on the inventory data
      // For example, you might want to filter out sold-out options or show inventory counts
    }
  }, [addOnInventory]);

  const selectedExpenseType = course.groupedAddOnProducts[
    'Residential Add On'
  ].find((product) => product.sfid === formik.values.expenseType);
  const totalPrice = coursePrice + (selectedExpenseType?.unitPrice || 0);

  // State for controlling the questionnaire dialog
  const [questionnaireOpen, setQuestionnaireOpen] = React.useState(false);
  const [questionnaireAnswers, setQuestionnaireAnswers] = React.useState<
    Record<string, string>
  >({});

  // Handle "Confirm and Pay" button click
  const handleConfirmAndPay = () => {
    // Get a copy of all form values except programQuestionnaire
    const mainFormValues = { ...formik.values };
    delete mainFormValues.programQuestionnaire;

    // Flag to track validation
    let hasMainFormErrors = false;

    // Touch all fields to trigger validation display
    Object.keys(mainFormValues).forEach((fieldName) => {
      if (typeof formik.setFieldTouched === 'function') {
        formik.setFieldTouched(fieldName, true, false);
      }
    });

    // Check required fields in main form (this is a basic validation)
    const requiredFields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zip',
      'expenseType',
      'agreeTerms',
    ];
    requiredFields.forEach((field) => {
      const value = (mainFormValues as Record<string, unknown>)[field];
      if (!value) {
        hasMainFormErrors = true;
      }
    });

    // Simple email validation
    if (mainFormValues.email && !/\S+@\S+\.\S+/.test(mainFormValues.email)) {
      hasMainFormErrors = true;
    }

    // Force form validation via submit if there are errors
    if (hasMainFormErrors) {
      formik.handleSubmit();
    } else {
      // If main form is valid, show the questionnaire
      setQuestionnaireOpen(true);
    }
  };

  // Handle questionnaire submission
  const handleQuestionnaireSubmit = (values: Record<string, string>) => {
    // Log incoming questionnaire values
    console.log('Questionnaire submitted with values:', values);

    // Store the questionnaire answers in local state
    setQuestionnaireAnswers(values);
    // Also pass to the parent component using the prop if available
    if (_setQuestionnaireAnswers) {
      _setQuestionnaireAnswers(values);
      console.log('Updated parent component with questionnaire answers');
    }
    console.log('Updated questionnaireAnswers state with:', values);

    // Here we need to update the main formik form with the questionnaire answers
    // Format the values to match the expected structure in the main form
    const programQuestionnaireValues: Record<string, string> = {};

    // Get the values from the questionnaire form and format them for the main form
    Object.keys(values).forEach((sfid) => {
      programQuestionnaireValues[sfid] = values[sfid];
    });

    console.log(
      'Created programQuestionnaireValues for formik:',
      programQuestionnaireValues
    );

    // Update the main formik form with the questionnaire answers
    if (typeof formik.setFieldValue === 'function') {
      formik.setFieldValue('programQuestionnaire', programQuestionnaireValues);
      console.log('Updated formik with programQuestionnaire values');
    } else {
      console.warn(
        'formik.setFieldValue is not a function, cannot update formik'
      );
    }

    // Proceed with form submission including questionnaire answers
    console.log('Proceeding with form submission (formik.handleSubmit)');
    formik.handleSubmit();
  };

  return (
    <>
      <main className="checkout-aol">
        <div className="container">
          <div className="row">
            <div className="col-12 col-lg-7">
              <div className="section--title">
                <h1 className="page-title">{course.title}</h1>
                <div className="description"></div>
              </div>
              <div className="section-box account-details">
                <h2 className="section__title">Account Details</h2>
                <div className="section__body">
                  <div className="form-inputs checkout-fields">
                    <div className="form-item">
                      <FormField name="firstName">
                        {({ field, form }: FormFieldProps<string>) => (
                          <FormItem>
                            <Label>First Name</Label>
                            <Input
                              {...field}
                              placeholder="First Name"
                              className={`${
                                form.touched[field.name] &&
                                form.errors[field.name]
                                  ? 'border-red-500'
                                  : ''
                              }`}
                            />
                            <FormMessage name="firstName" />
                          </FormItem>
                        )}
                      </FormField>
                    </div>
                    <div className="form-item">
                      <FormField name="lastName">
                        {({ field, form }: FormFieldProps<string>) => (
                          <FormItem>
                            <Label>Last Name</Label>
                            <Input
                              {...field}
                              placeholder="Last Name"
                              className={`${
                                form.touched[field.name] &&
                                form.errors[field.name]
                                  ? 'border-red-500'
                                  : ''
                              }`}
                            />
                            <FormMessage name="lastName" />
                          </FormItem>
                        )}
                      </FormField>
                    </div>
                    <div className="form-item">
                      <FormField name="address">
                        {({ field, form }: FormFieldProps<string>) => (
                          <FormItem>
                            <Label>Street Address</Label>
                            <Input
                              {...field}
                              placeholder="Street Address"
                              className={`${
                                form.touched[field.name] &&
                                form.errors[field.name]
                                  ? 'border-red-500'
                                  : ''
                              }`}
                            />
                            <FormMessage name="address" />
                          </FormItem>
                        )}
                      </FormField>
                    </div>
                    <div className="form-item">
                      <FormField name="city">
                        {({ field, form }: FormFieldProps<string>) => (
                          <FormItem>
                            <Label>City</Label>
                            <Input
                              {...field}
                              placeholder="City"
                              className={`${
                                form.touched[field.name] &&
                                form.errors[field.name]
                                  ? 'border-red-500'
                                  : ''
                              }`}
                            />
                            <FormMessage name="city" />
                          </FormItem>
                        )}
                      </FormField>
                    </div>
                    <div className="form-item">
                      <FormField name="state">
                        {({ field, form }: FormFieldProps<string>) => (
                          <FormItem>
                            <Label>State</Label>
                            <Select
                              value={field.value}
                              onValueChange={(value) =>
                                form.setFieldValue('state', value)
                              }
                            >
                              <SelectTrigger
                                className={`${
                                  form.touched[field.name] &&
                                  form.errors[field.name]
                                    ? 'border-red-500'
                                    : ''
                                }`}
                              >
                                <SelectValue placeholder="State" />
                              </SelectTrigger>
                              <SelectContent>
                                {US_STATES.map((state) => (
                                  <SelectItem
                                    key={state.value}
                                    value={state.value}
                                  >
                                    {state.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage name="state" />
                          </FormItem>
                        )}
                      </FormField>
                    </div>
                    <div className="form-item">
                      <FormField name="zip">
                        {({ field, form }: FormFieldProps<string>) => (
                          <FormItem>
                            <Label>ZIP</Label>
                            <Input
                              {...field}
                              placeholder="ZIP"
                              className={`${
                                form.touched[field.name] &&
                                form.errors[field.name]
                                  ? 'border-red-500'
                                  : ''
                              }`}
                            />
                            <FormMessage name="zip" />
                          </FormItem>
                        )}
                      </FormField>
                    </div>

                    <div className="form-item">
                      <FormField name="email">
                        {({ field, form }: FormFieldProps<string>) => (
                          <FormItem>
                            <Label>Email Address</Label>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Email"
                              className={`${
                                form.touched[field.name] &&
                                form.errors[field.name]
                                  ? 'border-red-500'
                                  : ''
                              }`}
                            />
                            <FormMessage name="email" />
                          </FormItem>
                        )}
                      </FormField>
                    </div>
                    <div className="form-item">
                      <FormField name="phone">
                        {({ field, form }: FormFieldProps<string>) => (
                          <FormItem>
                            <Label>Mobile Number</Label>
                            <div className="relative">
                              <PhoneInput
                                international
                                defaultCountry="US"
                                value={field.value}
                                onChange={(value) => {
                                  form.setFieldValue('phone', value || '');
                                  form.setFieldTouched('phone', true, false);
                                }}
                                className={`input-div ${
                                  form.touched[field.name] &&
                                  form.errors[field.name]
                                    ? 'border-red-500'
                                    : ''
                                }`}
                              />
                            </div>
                            <FormMessage name="phone" />
                          </FormItem>
                        )}
                      </FormField>
                    </div>

                    {/* The ProgramQuestionnaire dialog */}
                    {course.programQuestionnaire &&
                      course.programQuestionnaire.length > 0 && (
                        <ProgramQuestionnaire
                          questions={course.programQuestionnaire}
                          open={questionnaireOpen}
                          onOpenChange={setQuestionnaireOpen}
                          onSubmit={handleQuestionnaireSubmit}
                          initialValues={questionnaireAnswers}
                        />
                      )}
                  </div>
                  <div className="card-detail-wrapper">
                    <StripePaymentWrapper />
                  </div>
                </div>
              </div>

              {course?.course?.notes && (
                <div className="section-box checkout-notes">
                  <div className="note-title">
                    <div className="note-icon">
                      <Image
                        src="/images/icon-menu-board.png"
                        alt="notes"
                        width={24}
                        height={24}
                      />
                    </div>
                    <div className="note-title-text">Notes:</div>
                  </div>

                  <div className="note-content">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: course?.course?.notes || '',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="col-12 col-lg-5">
              <div className="checkout-sidebar">
                <div className="offer-box">
                  <div className="offer-type">
                    <div className="form-item radio">
                      <label>
                        <span className="radio-text">Regular Tuition:</span>
                        <span className="radio-value">${coursePrice}</span>
                      </label>
                    </div>
                    {selectedExpenseType && (
                      <div className="form-item radio">
                        <label>
                          <span className="radio-text">
                            {selectedExpenseType.name}:
                          </span>
                          <span className="radio-value">
                            ${selectedExpenseType.unitPrice}
                          </span>
                        </label>
                      </div>
                    )}
                    <div className="form-item radio">
                      <label>
                        <span className="radio-text">Total:</span>
                        <span className="radio-value">${totalPrice}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="">
                  <FormField name="expenseType">
                    {({ field, form }: FormFieldProps<string>) => (
                      <FormItem className="room-board-pricing">
                        <Label>Expense Type</Label>
                        <Select
                          value={field.value}
                          onValueChange={(value) =>
                            form.setFieldValue('expenseType', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Expense Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {addOnInventory?.data &&
                            addOnInventory.data['Residential Add On']
                              ? addOnInventory.data['Residential Add On'].map(
                                  (option) => (
                                    <SelectItem
                                      key={option.sfid}
                                      value={option.sfid}
                                      disabled={option.isSoldOut}
                                    >
                                      {option.name} - ${option.unitPrice}
                                      {option.isSoldOut ? ' (SOLD OUT)' : ''}
                                    </SelectItem>
                                  )
                                )
                              : course.groupedAddOnProducts[
                                  'Residential Add On'
                                ].map((option) => (
                                  <SelectItem
                                    key={option.sfid}
                                    value={option.sfid}
                                    disabled={option.isFull}
                                  >
                                    {option.name} - ${option.unitPrice}
                                    {option.isFull ? ' (FULL)' : ''}
                                  </SelectItem>
                                ))}
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-gray-500 mt-1">
                          *Expense includes meals
                        </p>
                        <FormMessage name="expenseType" />
                      </FormItem>
                    )}
                  </FormField>

                  <div className="section-box checkout-details">
                    <h2 className="section__title">Details:</h2>
                    <div className="section__body">
                      <div className="detail-item row">
                        <div className="label col-5">
                          <svg
                            className="detailsIcon icon-calendar"
                            viewBox="0 0 34 32"
                          >
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="4"
                              stroke-width="2.4"
                              d="M29.556 16c0 7.36-5.973 13.333-13.333 13.333s-13.333-5.973-13.333-13.333c0-7.36 5.973-13.333 13.333-13.333s13.333 5.973 13.333 13.333z"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="4"
                              stroke-width="2.4"
                              d="M21.168 20.24l-4.133-2.467c-0.72-0.427-1.307-1.453-1.307-2.293v-5.467"
                            ></path>
                          </svg>
                          Date:
                        </div>
                        <span className="value col-7">
                          {formatDateRange(
                            course.schedule.startDate,
                            course.schedule.endDate
                          )}
                        </span>
                      </div>
                      <div className="detail-item row">
                        <div className="label col-5">
                          <svg
                            className="detailsIcon icon-calendar"
                            viewBox="0 0 34 32"
                          >
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="10"
                              stroke-width="2.4"
                              d="M10.889 2.667v4"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="10"
                              stroke-width="2.4"
                              d="M21.555 2.667v4"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="10"
                              stroke-width="2.4"
                              d="M4.889 12.12h22.667"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="10"
                              stroke-width="2.4"
                              d="M28.222 11.333v11.333c0 4-2 6.667-6.667 6.667h-10.667c-4.667 0-6.667-2.667-6.667-6.667v-11.333c0-4 2-6.667 6.667-6.667h10.667c4.667 0 6.667 2.667 6.667 6.667z"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="4"
                              stroke-width="3.2"
                              d="M21.148 18.267h0.012"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="4"
                              stroke-width="3.2"
                              d="M21.148 22.267h0.012"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="4"
                              stroke-width="3.2"
                              d="M16.216 18.267h0.012"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="4"
                              stroke-width="3.2"
                              d="M16.216 22.267h0.012"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="4"
                              stroke-width="3.2"
                              d="M11.281 18.267h0.012"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="4"
                              stroke-width="3.2"
                              d="M11.281 22.267h0.012"
                            ></path>
                          </svg>
                          Timing:
                        </div>
                        <div className="value col-7">
                          {course.timings.map((timing) => (
                            <div key={timing.id}>
                              {new Date(timing.startDate).toLocaleDateString(
                                'en-US',
                                { weekday: 'short' }
                              )}
                              : {formatTime(timing.startTime)}-
                              {formatTime(timing.endTime)} {timing.timeZone}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="detail-item row">
                        <div className="label col-5">
                          <svg
                            className="detailsIcon icon-calendar"
                            viewBox="0 0 34 32"
                          >
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="4"
                              stroke-width="2.4"
                              d="M16.435 14.493c-0.133-0.013-0.293-0.013-0.44 0-3.173-0.107-5.693-2.707-5.693-5.907 0-3.267 2.64-5.92 5.92-5.92 3.267 0 5.92 2.653 5.92 5.92-0.013 3.2-2.533 5.8-5.707 5.907z"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="round"
                              stroke-linecap="round"
                              stroke-miterlimit="4"
                              stroke-width="2.4"
                              d="M9.768 19.413c-3.227 2.16-3.227 5.68 0 7.827 3.667 2.453 9.68 2.453 13.347 0 3.227-2.16 3.227-5.68 0-7.827-3.653-2.44-9.667-2.44-13.347 0z"
                            ></path>
                          </svg>
                          Instructor(s):
                        </div>
                        <div className="value col-7">
                          {course.teachers.primary.name}
                        </div>
                      </div>
                      <div className="detail-item row">
                        <div className="label col-5">
                          <svg
                            className="detailsIcon icon-calendar"
                            viewBox="0 0 34 32"
                          >
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="miter"
                              stroke-linecap="butt"
                              stroke-miterlimit="4"
                              stroke-width="2.4"
                              d="M16.223 17.907c2.297 0 4.16-1.863 4.16-4.16s-1.863-4.16-4.16-4.16c-2.298 0-4.16 1.863-4.16 4.16s1.863 4.16 4.16 4.16z"
                            ></path>
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="miter"
                              stroke-linecap="butt"
                              stroke-miterlimit="4"
                              stroke-width="2.4"
                              d="M5.049 11.32c2.627-11.547 19.733-11.533 22.347 0.013 1.533 6.773-2.68 12.507-6.373 16.053-2.68 2.587-6.92 2.587-9.613 0-3.68-3.547-7.893-9.293-6.36-16.067z"
                            ></path>
                          </svg>
                          Location:
                        </div>
                        <div className="value col-7">
                          <a
                            href="https://www.google.com/maps/search/?api=1&amp;query=949 Whispering Hills Road, Boone NC 28607 US"
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#FF9361]"
                          >
                            {course.location.street}, {course.location.city},{' '}
                            {course.location.province}{' '}
                            {course.location.postalCode}
                          </a>
                        </div>
                      </div>
                      <div className="detail-item row">
                        <div className="label col-5">
                          <svg
                            className="detailsIcon icon-calendar"
                            viewBox="0 0 34 32"
                          >
                            <path
                              fill="none"
                              stroke="#9598a6"
                              stroke-linejoin="miter"
                              stroke-linecap="butt"
                              stroke-miterlimit="10"
                              stroke-width="2.4"
                              d="M29.516 24.44c0 0.48-0.107 0.973-0.333 1.453s-0.52 0.933-0.907 1.36c-0.653 0.72-1.373 1.24-2.187 1.573-0.8 0.333-1.667 0.507-2.6 0.507-1.36 0-2.813-0.32-4.347-0.973s-3.067-1.533-4.587-2.64c-1.533-1.12-2.987-2.36-4.373-3.733-1.373-1.387-2.613-2.84-3.72-4.36-1.093-1.52-1.973-3.040-2.613-4.547-0.64-1.52-0.96-2.973-0.96-4.36 0-0.907 0.16-1.773 0.48-2.573 0.32-0.813 0.827-1.56 1.533-2.227 0.853-0.84 1.787-1.253 2.773-1.253 0.373 0 0.747 0.080 1.080 0.24 0.347 0.16 0.653 0.4 0.893 0.747l3.093 4.36c0.24 0.333 0.413 0.64 0.533 0.933 0.12 0.28 0.187 0.56 0.187 0.813 0 0.32-0.093 0.64-0.28 0.947-0.173 0.307-0.427 0.627-0.747 0.947l-1.013 1.053c-0.147 0.147-0.213 0.32-0.213 0.533 0 0.107 0.013 0.2 0.040 0.307 0.040 0.107 0.080 0.187 0.107 0.267 0.24 0.44 0.653 1.013 1.24 1.707 0.6 0.693 1.24 1.4 1.933 2.107 0.72 0.707 1.413 1.36 2.12 1.96 0.693 0.587 1.267 0.987 1.72 1.227 0.067 0.027 0.147 0.067 0.24 0.107 0.107 0.040 0.213 0.053 0.333 0.053 0.227 0 0.4-0.080 0.547-0.227l1.013-1c0.333-0.333 0.653-0.587 0.96-0.747 0.307-0.187 0.613-0.28 0.947-0.28 0.253 0 0.52 0.053 0.813 0.173s0.6 0.293 0.933 0.52l4.413 3.133c0.347 0.24 0.587 0.52 0.733 0.853 0.133 0.333 0.213 0.667 0.213 1.040z"
                            ></path>
                          </svg>
                          Contact Details:
                        </div>
                        <div className="value col-7">
                          <div>{course.contact.name}</div>
                          <a
                            href={`mailto:${course.contact.email}`}
                            className="text-[#FF9361]"
                          >
                            {course.contact.email}
                          </a>
                          <div>{course.contact.phone}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="section-box confirm-submit">
                    <FormField name="agreeTerms">
                      {({ field, form }: FormFieldProps<boolean>) => (
                        <FormItem>
                          <div className="form-item checkbox">
                            <Checkbox
                              id="agreeTerms"
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                form.setFieldValue(
                                  'agreeTerms',
                                  Boolean(checked)
                                );
                              }}
                            />
                            <Label
                              htmlFor="agreeTerms"
                              className="cursor-pointer"
                            >
                              I agree to the{' '}
                              <a href="#" className="text-[#FF9361]">
                                Program Participant agreement
                              </a>
                              .
                            </Label>
                          </div>
                          <FormMessage name="agreeTerms" />
                        </FormItem>
                      )}
                    </FormField>

                    {course.complianceQuestionnaire?.map((question) => (
                      <FormField
                        key={question.sfid}
                        name={`complianceAnswers.${question.sfid}`}
                      >
                        {({ field, form }: FormFieldProps<boolean>) => {
                          const fieldName = `complianceAnswers.${question.sfid}`;

                          return (
                            <FormItem>
                              <div className="form-item checkbox">
                                <Checkbox
                                  id={`compliance-${question.sfid}`}
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    form.setFieldValue(
                                      fieldName,
                                      Boolean(checked)
                                    );
                                    form.setFieldTouched(fieldName, true, true);
                                  }}
                                />
                                <Label
                                  htmlFor={`compliance-${question.sfid}`}
                                  className={`cursor-pointer`}
                                >
                                  <div
                                    dangerouslySetInnerHTML={{
                                      __html: question.question,
                                    }}
                                  />
                                </Label>
                              </div>
                              <FormMessage
                                name="complianceAnswers"
                                innerKey={question.sfid}
                              />
                            </FormItem>
                          );
                        }}
                      </FormField>
                    ))}
                    <div className="note">
                      For any health related questions, please contact us at{' '}
                      <a
                        href="mailto:health.info@us.artofliving.org"
                        className="text-[#FF9361]"
                      >
                        health.info@us.artofliving.org
                      </a>
                    </div>
                    <div className="form-item submit-item">
                      <Button
                        type="button"
                        className="submit-btn"
                        disabled={loading || disabled}
                        onClick={handleConfirmAndPay}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : disabled ? (
                          'Course Fully Booked'
                        ) : (
                          'Confirm and Pay'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};
