import {
  Formik,
  Form as FormikForm,
  Field,
  FieldProps,
  FormikProps,
} from 'formik';
import * as Yup from 'yup';
import * as React from 'react';

export { Formik, Field };
export { FormikForm as Form };
export type { FieldProps, FormikProps };

export interface FormikFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  expenseType: string;
  residential?: string;
  accommodation?: string;
  agreeTerms: boolean;
  complianceAnswers: Record<string, boolean>;
  programQuestionnaire?: Record<string, string>;
}

export const formikValidationSchema = Yup.object().shape({
  firstName: Yup.string()
    .trim()
    .required('First name is required')
    .test('not-only-spaces', 'First name is required', (value) =>
      value ? value.trim().length > 0 : false
    ),
  lastName: Yup.string()
    .trim()
    .required('Last name is required')
    .test('not-only-spaces', 'Last name is required', (value) =>
      value ? value.trim().length > 0 : false
    ),
  email: Yup.string()
    .trim()
    .required('Email is required')
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Invalid email format. Please enter a valid email address'
    )
    .test('not-only-spaces', 'Email is required', (value) =>
      value ? value.trim().length > 0 : false
    ),
  phone: Yup.string()
    .required('Phone number is required')
    .matches(
      /^[0-9+\-\s()]*$/,
      'Phone number can only contain numbers, +, -, spaces, and parentheses'
    )
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot be longer than 15 digits')
    .test(
      'has-numbers',
      'Phone number must contain at least 10 digits',
      (value) => {
        const digitCount = (value || '').replace(/[^0-9]/g, '').length;
        return digitCount >= 10;
      }
    ),
  address: Yup.string()
    .trim()
    .required('Address is required')
    .test('not-only-spaces', 'Address is required', (value) =>
      value ? value.trim().length > 0 : false
    ),
  city: Yup.string()
    .trim()
    .required('City is required')
    .test('not-only-spaces', 'City is required', (value) =>
      value ? value.trim().length > 0 : false
    ),
  state: Yup.string()
    .trim()
    .required('State is required')
    .test('not-only-spaces', 'State is required', (value) =>
      value ? value.trim().length > 0 : false
    ),
  zip: Yup.string()
    .trim()
    .required('ZIP code is required')
    .test('not-only-spaces', 'ZIP code is required', (value) =>
      value ? value.trim().length > 0 : false
    ),
  expenseType: Yup.string().required('Expense type is required'),
  agreeTerms: Yup.boolean().oneOf(
    [true],
    'You must agree to the Program Participant agreement'
  ),
  complianceAnswers: Yup.lazy((obj) => {
    if (!obj || Object.keys(obj).length === 0) return Yup.object();

    // Create schema that requires all values to be true
    const shape = Object.keys(obj).reduce<Record<string, Yup.AnySchema>>(
      (acc, key) => {
        // Handle nested object case where the key contains objects with IDs
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          acc[key] = Yup.object().test(
            'all-checked',
            'You must agree to this policy to proceed',
            (value) => value && Object.values(value).every((v) => v === true)
          );
        } else {
          // Handle standard boolean case
          acc[key] = Yup.boolean()
            .required('You must check this box')
            .oneOf([true], 'You must agree to this policy to proceed');
        }
        return acc;
      },
      {}
    );

    return Yup.object().shape(shape);
  }),
  // programQuestionnaire validation is removed as it will be handled separately
  // in the ProgramQuestionnaire component after the "Confirm & Pay" button is clicked
});

export type FormFieldProps<T = string> = FieldProps<FormikFormValues> & {
  field: {
    value: T;
    name: string;
    onChange: (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => void;
    onBlur: (
      e: React.FocusEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => void;
  };
};

export const FormField = <T,>({
  name,
  children,
}: {
  name: string;
  children: ((props: FormFieldProps<T>) => React.ReactNode) | React.ReactNode;
}) => {
  return (
    <Field name={name}>
      {(props: FormFieldProps<T>) =>
        typeof children === 'function' ? children(props) : children
      }
    </Field>
  );
};

export const FormItem: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className || ''}`} {...props}>
      {children}
    </div>
  );
};

export const FormMessage: React.FC<{
  name: string;
  className?: string;
  innerKey?: string;
}> = ({ name, className, innerKey }) => {
  return (
    <Field name={name}>
      {({ form }: FormFieldProps) => {
        let error = null;

        // For direct field errors (non-nested)
        if (!innerKey) {
          error = form.touched[name] && form.errors[name];
        } else {
          // For nested objects (like programQuestionnaire.sfid or complianceAnswers.sfid)
          const touchedField = form.touched[name];
          const valueField = form.values[name];
          const errorField = form.errors[name];

          // Check if the field and error exist and are objects
          if (
            touchedField &&
            typeof touchedField === 'object' &&
            errorField &&
            typeof errorField === 'object'
          ) {
            // Check if there's actually an error for this specific key
            const hasError = (errorField as Record<string, string>)[innerKey];
            const isTouched = (touchedField as Record<string, boolean>)[
              innerKey
            ];
            const fieldValue =
              valueField && typeof valueField === 'object'
                ? valueField[innerKey]
                : undefined;

            if (hasError && isTouched) {
              // For complianceAnswers (boolean fields)
              if (
                name === 'complianceAnswers' &&
                typeof fieldValue === 'boolean' &&
                fieldValue === true
              ) {
                // Don't show error if the checkbox is checked
                error = null;
              }
              // For programQuestionnaire (string fields)
              else if (
                name === 'programQuestionnaire' &&
                typeof fieldValue === 'string' &&
                fieldValue !== ''
              ) {
                // Don't show error if the field has a value
                error = null;
              } else {
                // Show the error
                error = hasError;
              }
            }
          }
        }

        if (!error) return null;
        return (
          <div className={`text-sm text-red-500 mt-1 ${className || ''}`}>
            {error?.toString()}
          </div>
        );
      }}
    </Field>
  );
};
