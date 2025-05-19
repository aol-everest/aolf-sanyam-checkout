import * as React from 'react';
import { Formik, Form, Field, FormikHelpers, FieldProps } from 'formik';
import * as Yup from 'yup';
import { FormItem } from '@/components/ui/formik-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Define the question type that's used in the Course
interface ProgramQuestionItem {
  sfid: string;
  name: string;
  question: string;
  options: string | null;
  questionType: string;
  questionCategory: string;
  isRequired: boolean;
  sequence: number;
}

// Interface for questionnaire form values
interface QuestionnaireFormValues {
  [key: string]: string;
}

interface ProgramQuestionnaireProps {
  questions: ProgramQuestionItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (values: QuestionnaireFormValues) => void;
  initialValues?: QuestionnaireFormValues;
}

export const ProgramQuestionnaire: React.FC<ProgramQuestionnaireProps> = ({
  questions,
  open,
  onOpenChange,
  onSubmit,
  initialValues = {},
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Create validation schema based on required questions
  const validationSchema = React.useMemo(() => {
    const schemaShape: Record<string, Yup.StringSchema> = {};

    if (questions && questions.length > 0) {
      questions.forEach((question) => {
        if (question.isRequired) {
          schemaShape[question.sfid] = Yup.string().required(
            'This question is required'
          );
        }
      });
    }

    return Yup.object().shape(schemaShape);
  }, [questions]);

  // Create default values object
  const defaultValues = React.useMemo(() => {
    const values: QuestionnaireFormValues = { ...initialValues };

    // Initialize any missing values
    if (questions && questions.length > 0) {
      questions.forEach((question) => {
        if (!values[question.sfid]) {
          values[question.sfid] = '';
        }
      });
    }

    return values;
  }, [questions, initialValues]);

  if (!questions || questions.length === 0) {
    return null;
  }

  // Handle form submission
  const handleFormSubmit = async (
    values: QuestionnaireFormValues,
    { setSubmitting }: FormikHelpers<QuestionnaireFormValues>
  ) => {
    setIsSubmitting(true);

    if (onSubmit) {
      onSubmit(values);
    }

    // Small delay to indicate processing
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitting(false);
      onOpenChange(false); // Close dialog after successful submission
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Program Questionnaire
          </DialogTitle>
          <DialogDescription>
            Please answer the following questions about the program. All fields
            marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Formik
          initialValues={defaultValues}
          validationSchema={validationSchema}
          onSubmit={handleFormSubmit}
        >
          {({
            values,
            errors,
            touched,
            setFieldValue,
            setFieldTouched,
            isValid,
            dirty,
          }) => (
            <Form>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                {questions.map((question) => (
                  <div key={question.sfid} className="space-y-3">
                    <FormItem>
                      <div className="flex items-start">
                        <div
                          className="font-medium"
                          dangerouslySetInnerHTML={{
                            __html: question.question,
                          }}
                        />
                        {question.isRequired && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>

                      {/* Render different input types based on questionType */}
                      {question.questionType === 'Yes/No' && (
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id={`${question.sfid}-yes`}
                              name={question.sfid}
                              value="Yes"
                              checked={values[question.sfid] === 'Yes'}
                              onChange={() => {
                                setFieldValue(question.sfid, 'Yes');
                                setFieldTouched(question.sfid, true, true);
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
                              name={question.sfid}
                              value="No"
                              checked={values[question.sfid] === 'No'}
                              onChange={() => {
                                setFieldValue(question.sfid, 'No');
                                setFieldTouched(question.sfid, true, true);
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
                      )}

                      {/* Text input for Text questions */}
                      {question.questionType === 'Text' && (
                        <Field name={question.sfid}>
                          {({ field }: FieldProps) => (
                            <Input
                              {...field}
                              placeholder="Your answer"
                              className={`${
                                touched[question.sfid] && errors[question.sfid]
                                  ? 'border-red-500'
                                  : ''
                              }`}
                            />
                          )}
                        </Field>
                      )}

                      {/* Select dropdown for Picklist questions */}
                      {question.questionType === 'Picklist' &&
                        question.options && (
                          <Select
                            value={values[question.sfid] || ''}
                            onValueChange={(value) => {
                              setFieldValue(question.sfid, value);
                              setFieldTouched(question.sfid, true, true);
                            }}
                          >
                            <SelectTrigger
                              className={`${
                                touched[question.sfid] && errors[question.sfid]
                                  ? 'border-red-500'
                                  : ''
                              }`}
                            >
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.split(';').map((option) => (
                                <SelectItem
                                  key={option.trim()}
                                  value={option.trim()}
                                >
                                  {option.trim()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                      {/* Show validation errors */}
                      {touched[question.sfid] && errors[question.sfid] && (
                        <div className="text-sm text-red-500">
                          {errors[question.sfid] as string}
                        </div>
                      )}
                    </FormItem>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full bg-[#FF9361] hover:bg-[#ff7a3d]"
                  disabled={isSubmitting || (!isValid && dirty)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Save Answers & Continue'
                  )}
                </Button>
              </DialogFooter>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
};
