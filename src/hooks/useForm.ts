import { useState, useCallback } from 'react';

type ValidationRule<T> = {
  validator: (value: T) => boolean;
  message: string;
};

type ValidationRules<T> = Partial<Record<keyof T, ValidationRule<T[keyof T]>[]>>;

type FormErrors<T> = Partial<Record<keyof T, string>>;

interface UseFormProps<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => FormErrors<T>;
  validationRules?: ValidationRules<T>;
}

const useForm = <T extends Record<string, any>>({
  initialValues,
  onSubmit,
  validate,
  validationRules = {},
}: UseFormProps<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback(
    (name: keyof T, value: T[keyof T]): string | undefined => {
      // Check custom validation rules first
      if (validationRules[name]) {
        for (const rule of validationRules[name]!) {
          if (!rule.validator(value)) {
            return rule.message;
          }
        }
      }

      // Then check the global validate function if provided
      if (validate) {
        const validationErrors = validate({ ...values, [name]: value } as T);
        return validationErrors[name as keyof T];
      }

      return undefined;
    },
    [validate, validationRules, values]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      
      // Handle different input types
      let finalValue: any = value;
      if (type === 'number') {
        finalValue = value === '' ? '' : Number(value);
      } else if (type === 'checkbox') {
        finalValue = (e.target as HTMLInputElement).checked;
      }

      setValues((prevValues) => ({
        ...prevValues,
        [name]: finalValue,
      }));

      // Clear error when user starts typing
      if (errors[name as keyof T]) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const error = validateField(name as keyof T, value as T[keyof T]);
      
      if (error) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: error,
        }));
      }
    },
    [validateField]
  );

  const setFieldValue = useCallback((name: keyof T, value: T[keyof T]) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  }, []);

  const setFieldError = useCallback((name: keyof T, error: string) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: error,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      
      // Run validation if provided
      let formErrors: FormErrors<T> = {};
      
      if (validate) {
        formErrors = validate(values);
      }
      
      // Check validation rules for each field
      Object.keys(values).forEach((key) => {
        const fieldName = key as keyof T;
        const fieldValue = values[fieldName];
        const fieldError = validateField(fieldName, fieldValue);
        
        if (fieldError) {
          formErrors = {
            ...formErrors,
            [fieldName]: fieldError,
          };
        }
      });
      
      setErrors(formErrors);
      
      // If no errors, submit the form
      if (Object.keys(formErrors).length === 0) {
        try {
          setIsSubmitting(true);
          await onSubmit(values);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [onSubmit, validate, validateField, values]
  );

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    setValues,
    setErrors,
  };
};

export default useForm;
