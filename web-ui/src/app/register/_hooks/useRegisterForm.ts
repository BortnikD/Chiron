'use client';

import { useState, type FormEvent } from 'react';
import type { RegisterFormData, RegisterPayload } from '@/app/login/_components/types';
import { getUtf8ByteLength } from '@/shared/lib';

interface UseRegisterFormOptions {
  onSubmit: (payload: RegisterPayload) => void | Promise<void>;
  setError: (error: string | null) => void;
}

export function useRegisterForm({ onSubmit, setError }: UseRegisterFormOptions) {
  const [form, setForm] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const setField = <K extends keyof RegisterFormData>(key: K, value: RegisterFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Укажите имя и фамилию');
      return;
    }
    if (!form.email.trim() || !form.phone.trim()) {
      setError('Укажите email и номер телефона');
      return;
    }
    const normalizedPhone = form.phone.trim().replace(/[\s\-()]/g, '');
    if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
      setError('Укажите телефон в международном формате, например +79000000000');
      return;
    }
    if (form.password.length < 8) {
      setError('Пароль должен содержать не менее 8 символов');
      return;
    }
    if (getUtf8ByteLength(form.password) > 72) {
      setError('Пароль не должен превышать 72 байта в UTF-8');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      ...(form.middleName?.trim() ? { middleName: form.middleName.trim() } : {}),
      email: form.email.trim(),
      phone: normalizedPhone,
      password: form.password,
    });
  };

  return {
    form,
    setField,
    showPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    showConfirmPassword,
    toggleShowConfirmPassword: () => setShowConfirmPassword((prev) => !prev),
    handleSubmit,
  };
}
