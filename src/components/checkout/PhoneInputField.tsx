import { FieldProps } from 'formik';
import PhoneInput from 'react-phone-number-input';
import { cn } from '@/lib/utils';
import 'react-phone-number-input/style.css';

export const PhoneInputField = ({ field, form }: FieldProps) => (
  <PhoneInput
    international
    defaultCountry="US"
    value={field.value}
    onChange={(value) => form.setFieldValue(field.name, value || '')}
    className={cn(
      'h-12 text-base',
      form.touched[field.name] && form.errors[field.name] && 'border-red-500'
    )}
  />
);
