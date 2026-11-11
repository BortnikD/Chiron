import type { FormEvent, ReactNode } from 'react';

export type AuthMode = 'login' | 'register';

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export type RegisterField = keyof RegisterFormData;
export type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  middleName?: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  loading: boolean;
  onSubmit: (e: FormEvent) => void;
  onSwitchToRegister: () => void;
  isDev?: boolean;
}

export interface RegisterFormProps {
  loading: boolean;
  onSubmit: (payload: RegisterPayload) => void | Promise<void>;
  onSwitchToLogin: () => void;
  setError: (error: string | null) => void;
  serverFieldErrors?: RegisterFieldErrors;
  clearServerFieldError?: (field: RegisterField) => void;
}

export interface DevAccount {
  id: string;
  roleName: string;
  subTitle: string;
  initials: string;
  email: string;
  password: string;
}

export interface QuickDevLoginPanelProps {
  onQuickLogin: (email: string, pass: string) => void;
  disabled?: boolean;
}

export interface AuthBrandSideProps {
  children?: ReactNode;
}
