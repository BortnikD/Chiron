'use client';

import { useMemo, useState, type FormEvent } from 'react';
import type {
  RegisterField,
  RegisterFieldErrors,
  RegisterFormData,
  RegisterPayload,
} from '@/app/login/_components/types';
import { getUtf8ByteLength } from '@/shared/lib';

interface UseRegisterFormOptions {
  onSubmit: (payload: RegisterPayload) => void | Promise<void>;
  setError: (error: string | null) => void;
  serverFieldErrors?: RegisterFieldErrors;
  clearServerFieldError?: (field: RegisterField) => void;
}

const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PHONE_REGEX = /^\+?\d{10,15}$/;

function validateRegisterForm(form: RegisterFormData): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  const email = form.email.trim();
  if (!email) {
    errors.email = 'Обязательное поле';
  } else if (email.length > 254 || !EMAIL_REGEX.test(email)) {
    errors.email = 'Некорректный email';
  }

  if (!form.password) {
    errors.password = 'Обязательное поле';
  } else if (form.password.length < 8) {
    errors.password = 'Пароль должен содержать не менее 8 символов';
  } else if (getUtf8ByteLength(form.password) > 72) {
    errors.password = 'Пароль не должен превышать 72 байта в UTF-8';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Обязательное поле';
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Пароли не совпадают';
  }

  const firstName = form.firstName.trim();
  if (!firstName) {
    errors.firstName = 'Обязательное поле';
  } else if (firstName.length > 100) {
    errors.firstName = 'Не более 100 символов';
  }

  const lastName = form.lastName.trim();
  if (!lastName) {
    errors.lastName = 'Обязательное поле';
  } else if (lastName.length > 100) {
    errors.lastName = 'Не более 100 символов';
  }

  if (form.middleName.trim().length > 100) {
    errors.middleName = 'Не более 100 символов';
  }

  const phoneRaw = form.phone.trim();
  const normalizedPhone = phoneRaw.replace(/[\s\-()]/g, '');
  if (!phoneRaw) {
    errors.phone = 'Обязательное поле';
  } else if (!PHONE_REGEX.test(normalizedPhone)) {
    errors.phone = 'Формат +7…, от 10 до 15 цифр';
  }

  return errors;
}

export function useRegisterForm({
  onSubmit,
  setError,
  serverFieldErrors,
  clearServerFieldError,
}: UseRegisterFormOptions) {
  const [form, setForm] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [clientErrors, setClientErrors] = useState<RegisterFieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const setField = <K extends RegisterField>(key: K, value: RegisterFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setClientErrors((prev) => {
      if (!prev[key] && key !== 'password') return prev;
      const next = { ...prev };
      delete next[key];
      if (key === 'password') {
        delete next.confirmPassword;
      }
      return next;
    });
    clearServerFieldError?.(key);
    setError(null);
  };

  const errors = useMemo<RegisterFieldErrors>(
    () => ({ ...serverFieldErrors, ...clientErrors }),
    [serverFieldErrors, clientErrors]
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationErrors = validateRegisterForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setClientErrors(validationErrors);
      return;
    }

    setClientErrors({});
    const normalizedPhone = form.phone.trim().replace(/[\s\-()]/g, '');
    const trimmedMiddle = form.middleName.trim();

    void onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      ...(trimmedMiddle ? { middleName: trimmedMiddle } : {}),
      email: form.email.trim(),
      phone: normalizedPhone,
      password: form.password,
    });
  };

  return {
    form,
    errors,
    setField,
    showPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    showConfirmPassword,
    toggleShowConfirmPassword: () => setShowConfirmPassword((prev) => !prev),
    handleSubmit,
  };
}
