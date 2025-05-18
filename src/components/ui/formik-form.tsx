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
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
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
  address: Yup.string().required('Address is required'),
  city: Yup.string().required('City is required'),
  state: Yup.string().required('State is required'),
  zip: Yup.string().required('ZIP code is required'),
  expenseType: Yup.string().required('Expense type is required'),
  agreeTerms: Yup.boolean().oneOf(
    [true],
    'You must agree to the Program Participant agreement'
  ),
  complianceAnswers: Yup.lazy((obj) => {
    if (!obj || Object.keys(obj).length === 0) return Yup.object();

    // Create schema that requires all values to be true
    const shape = Object.keys(obj).reduce<Record<string, Yup.BooleanSchema>>(
      (acc, key) => {
        acc[key] = Yup.boolean()
          .required('You must check this box')
          .oneOf([true], 'You must agree to this policy to proceed');
        return acc;
      },
      {}
    );

    return Yup.object().shape(shape);
  }),
  programQuestionnaire: Yup.lazy((obj) => {
    if (!obj || Object.keys(obj).length === 0) return Yup.object();

    // We need a schema that validates each field
    const shape = Object.keys(obj).reduce<Record<string, Yup.StringSchema>>(
      (acc, key) => {
        // Make every field required - the component will decide which ones to validate
        acc[key] = Yup.string()
          .typeError('Required')
          .test('required-test', 'This question is required', (value) => {
            // Check for non-empty string
            return value !== undefined && value !== '';
          });
        return acc;
      },
      {}
    );

    return Yup.object().shape(shape);
  }),
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
}> = ({ name, className }) => {
  return (
    <Field name={name}>
      {({ form }: FormFieldProps) => {
        const error = form.touched[name] && form.errors[name];
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
