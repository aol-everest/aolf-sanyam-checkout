import * as React from 'react';
// Dialog components commented out for debugging purposes
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from '@/components/ui/dialog';
import {
  FormField,
  FormItem,
  FormMessage,
  FormikFormValues,
  FormFieldProps,
  FormikProps,
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
import type { CourseData } from '@/lib/api';
// import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { Checkbox } from '@/components/ui/checkbox';
// Import the StripeCardWrapper for when we need to reference it
import { StripeCardWrapper } from '@/components/checkout/StripeCardWrapper';

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

interface MainContentProps {
  formik: Pick<FormikProps<FormikFormValues>, 'handleSubmit' | 'values'>;
  showQuestionnaire: boolean;
  setShowQuestionnaire: (show: boolean) => void;
  onQuestionnaireSubmit: (values: FormikFormValues) => void | Promise<void>;
  loading: boolean;
  course: CourseData & {
    groupedAddOnProducts: {
      'Residential Add On': ResidentialAddOnProduct[];
    };
  };
  setQuestionnaireAnswers: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
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
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  setQuestionnaireAnswers: _setQuestionnaireAnswers,
}: MainContentProps) => {
  const coursePrice = course.payment?.pricing?.price?.unitPrice || 0;
  const selectedExpenseType = course.groupedAddOnProducts[
    'Residential Add On'
  ].find((product) => product.sfid === formik.values.expenseType);
  const totalPrice = coursePrice + (selectedExpenseType?.unitPrice || 0);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-8">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Account Details
                    </h2>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
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

                    {course.programQuestionnaire &&
                      course.programQuestionnaire.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                          <h3 className="text-lg font-medium mb-4">
                            Program Questionnaire
                          </h3>
                          <div className="space-y-4">
                            {course.programQuestionnaire.map((question) => (
                              <FormField
                                key={question.sfid}
                                name={`programQuestionnaire.${question.sfid}`}
                              >
                                {({ field, form }: FormFieldProps<string>) => {
                                  // Explicitly check for errors and touched state
                                  const fieldName = `programQuestionnaire.${question.sfid}`;
                                  const hasError =
                                    form.touched[fieldName] &&
                                    form.errors[fieldName];

                                  return (
                                    <FormItem className="space-y-3">
                                      <div
                                        className="font-medium"
                                        dangerouslySetInnerHTML={{
                                          __html: question.question,
                                        }}
                                      />
                                      {question.isRequired && (
                                        <span className="text-red-500 ml-1">
                                          *
                                        </span>
                                      )}
                                      <div className="flex items-center space-x-6">
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            id={`${question.sfid}-yes`}
                                            name={fieldName}
                                            value="Yes"
                                            checked={field.value === 'Yes'}
                                            onChange={() => {
                                              form.setFieldValue(
                                                fieldName,
                                                'Yes'
                                              );
                                              form.setFieldTouched(
                                                fieldName,
                                                true,
                                                true
                                              );
                                            }}
                                            className="h-4 w-4 border-gray-300 text-[#FF9361] focus:ring-[#FF9361]"
                                          />
                                          <Label
                                            htmlFor={`${question.sfid}-yes`}
                                            className="cursor-pointer"
                                          >
                                            Yes
                                          </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="radio"
                                            id={`${question.sfid}-no`}
                                            name={fieldName}
                                            value="No"
                                            checked={field.value === 'No'}
                                            onChange={() => {
                                              form.setFieldValue(
                                                fieldName,
                                                'No'
                                              );
                                              form.setFieldTouched(
                                                fieldName,
                                                true,
                                                true
                                              );
                                            }}
                                            className="h-4 w-4 border-gray-300 text-[#FF9361] focus:ring-[#FF9361]"
                                          />
                                          <Label
                                            htmlFor={`${question.sfid}-no`}
                                            className="cursor-pointer"
                                          >
                                            No
                                          </Label>
                                        </div>
                                      </div>
                                      {/* Direct error display for debugging */}
                                      {hasError && (
                                        <div className="text-sm text-red-500">
                                          {String(form.errors[fieldName])}
                                        </div>
                                      )}
                                      {/* Show which questions are required */}
                                      {question.isRequired &&
                                        !field.value &&
                                        !hasError &&
                                        form.submitCount > 0 && (
                                          <div className="text-sm text-red-500">
                                            This question is required
                                          </div>
                                        )}
                                    </FormItem>
                                  );
                                }}
                              </FormField>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <StripeCardWrapper />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {course.notes && (
                <div className="bg-white rounded-xl shadow-sm p-8 mt-8">
                  <div className="flex items-center gap-2 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-[#FF9361]"
                    >
                      <path d="M12 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h8" />
                      <polyline points="16 7 21 12 16 17" />
                    </svg>
                    <span className="text-lg font-medium">Notes:</span>
                  </div>

                  <div className="space-y-6 text-sm">
                    <div dangerouslySetInnerHTML={{ __html: course.notes }} />
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="bg-[#FF9361] text-white p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <span>Regular Tuition:</span>
                    <span>${coursePrice}</span>
                  </div>
                  {selectedExpenseType && (
                    <div className="flex justify-between items-center mt-2">
                      <span>{selectedExpenseType.name}:</span>
                      <span>${selectedExpenseType.unitPrice}</span>
                    </div>
                  )}
                  <div className="border-t border-white/20 mt-2 pt-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total:</span>
                      <span>${totalPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField name="expenseType">
                    {({ field, form }: FormFieldProps<string>) => (
                      <FormItem>
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
                            {course.groupedAddOnProducts[
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

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-4">Details:</h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <span className="text-gray-500">Date:</span>
                        <span>
                          {formatDateRange(
                            course.schedule.startDate,
                            course.schedule.endDate
                          )}
                        </span>
                      </div>
                      <div className="flex gap-2 items-start">
                        <span className="text-gray-500">Timing:</span>
                        <div className="space-y-1">
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
                      <div className="flex gap-2">
                        <span className="text-gray-500">Instructor(s):</span>
                        <span>{course.teachers.primary.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500">Location:</span>
                        <a
                          href={course.location.center?.centerUrl}
                          className="text-[#FF9361]"
                        >
                          {course.location.street}, {course.location.city},{' '}
                          {course.location.province}{' '}
                          {course.location.postalCode}
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-500">Contact Details:</span>
                        <div>
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

                  <div className="space-y-4">
                    <FormField name="agreeTerms">
                      {({ field, form }: FormFieldProps<boolean>) => (
                        <FormItem>
                          <div className="flex items-start gap-2">
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
                              <div className="flex items-start gap-2">
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
                  </div>

                  <div className="text-sm">
                    For any health related questions, please contact us at{' '}
                    <a
                      href="mailto:health.info@us.artofliving.org"
                      className="text-[#FF9361]"
                    >
                      health.info@us.artofliving.org
                    </a>
                  </div>

                  <Button
                    type="button"
                    className="w-full bg-[#FF9361] hover:bg-[#ff7a3d] mt-4"
                    disabled={loading}
                    onClick={() => formik.handleSubmit()}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
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

      {/* Questionnaire dialog commented out for debugging */}
      {/* <Dialog open={showQuestionnaire} onOpenChange={setShowQuestionnaire}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Program Questionnaire</DialogTitle>
            <DialogDescription>
              Please answer the following questions to complete your
              registration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 overflow-y-auto max-h-[50vh] pr-6">
            {course.programQuestionnaire?.map((question) => (
              <div key={question.sfid} className="space-y-2">
                <Label className="text-base">
                  {question.question.replace(/<\/?p>/g, '')}
                  {question.isRequired && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                {question.questionType === 'Yes/No' && (
                  <div className="flex gap-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={`${question.sfid}-yes`}
                        name={question.sfid}
                        value="Yes"
                        onChange={(e) =>
                          setQuestionnaireAnswers((prev) => ({
                            ...prev,
                            [question.sfid]: e.target.value,
                          }))
                        }
                        className="mr-2"
                      />
                      <Label htmlFor={`${question.sfid}-yes`}>Yes</Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={`${question.sfid}-no`}
                        name={question.sfid}
                        value="No"
                        onChange={(e) =>
                          setQuestionnaireAnswers((prev) => ({
                            ...prev,
                            [question.sfid]: e.target.value,
                          }))
                        }
                        className="mr-2"
                      />
                      <Label htmlFor={`${question.sfid}-no`}>No</Label>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button
              type="button"
              onClick={() => onQuestionnaireSubmit(formik.values)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog> */}
    </>
  );
};
