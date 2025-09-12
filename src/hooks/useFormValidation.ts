import { useState, useCallback } from 'react';

type ValidationRule<T> = {
  validator: (value: T) => boolean;
  message: string;
};

type ValidationRules<T> = Partial<Record<keyof T, ValidationRule<T[keyof T]>[]>>;

type FormErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormValidationOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  onSubmit?: (values: T) => void | Promise<void>;
}

/**
 * A custom hook for handling form validation
 * @param initialValues - The initial form values
 * @param validationRules - Validation rules for each field
 * @param onSubmit - Optional callback when form is submitted and valid
 * @returns Form state and validation methods
 * 
 * @example
 * const { values, errors, handleChange, handleSubmit, validateField } = useFormValidation({
 *   initialValues: { email: '', password: '' },
 *   validationRules: {
 *     email: [
 *       { validator: (val) => !!val, message: 'Email is required' },
 *       { validator: (val) => /\S+@\S+\.\S+/.test(val), message: 'Invalid email format' }
 *     ],
 *     password: [
 *       { validator: (val) => val.length >= 8, message: 'Password must be at least 8 characters' }
 *     ]
 *   },
 *   onSubmit: (values) => console.log('Form submitted:', values)
 * });
 */
const useFormValidation = <T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
}: UseFormValidationOptions<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (name: keyof T, value: T[keyof T]): string[] => {
      const fieldRules = validationRules?.[name] || [];
      const fieldErrors: string[] = [];

      for (const rule of fieldRules) {
        if (!rule.validator(value)) {
          fieldErrors.push(rule.message);
        }
      }

      return fieldErrors;
    },
    [validationRules]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors<T> = {};
    let isValid = true;

    Object.keys(values).forEach((key) => {
      const fieldName = key as keyof T;
      const fieldValue = values[fieldName];
      const fieldErrors = validateField(fieldName, fieldValue);

      if (fieldErrors.length > 0) {
        newErrors[fieldName] = fieldErrors[0]; // Show first error only
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  // Handle input change with validation
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target as HTMLInputElement;
      
      // Handle different input types
      let finalValue: any = value;
      if (type === 'number') {
        finalValue = value === '' ? '' : Number(value);
      } else if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
      }

      // Update the value
      setValues((prev) => ({
        ...prev,
        [name]: finalValue,
      }));

      // Clear error when user starts typing
      if (errors[name as keyof T]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  // Handle form submission
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      
      const isValid = validateForm();
      
      if (isValid && onSubmit) {
        try {
          setIsSubmitting(true);
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
      
      return isValid;
    },
    [onSubmit, validateForm, values]
  );

  // Set field value programmatically
  const setFieldValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  // Set field error programmatically
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  // Reset form to initial values
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  // Check if a specific field has an error
  const hasError = useCallback(
    (name: keyof T): boolean => {
      return !!errors[name];
    },
    [errors]
  );

  // Get error message for a specific field
  const getError = useCallback(
    (name: keyof T): string | undefined => {
      return errors[name];
    },
    [errors]
  );

  // Get field props for MUI TextField
  const getFieldProps = useCallback(
    (name: keyof T) => ({
      name: name as string,
      value: values[name] ?? '',
      onChange: handleChange,
      error: hasError(name),
      helperText: getError(name),
    }),
    [values, handleChange, hasError, getError]
  );

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFieldValue,
    setFieldError,
    validateField,
    validateForm,
    resetForm,
    hasError,
    getError,
    getFieldProps,
    // For direct state updates if needed
    setValues,
    setErrors,
  };
};

export default useFormValidation;
