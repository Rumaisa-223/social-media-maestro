'use client';

import { toast as hotToast, ToastOptions } from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'loading' | 'custom';

interface UseToastReturn {
  toast: typeof hotToast;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  loading: (message: string, options?: ToastOptions) => void;
  custom: (message: string, options?: ToastOptions) => void;
}

export const useToast = (): UseToastReturn => {
  const success = (message: string, options?: ToastOptions) => {
    hotToast.success(message, options);
  };

  const error = (message: string, options?: ToastOptions) => {
    hotToast.error(message, options);
  };

  const loading = (message: string, options?: ToastOptions) => {
    hotToast.loading(message, options);
  };

  const custom = (message: string, options?: ToastOptions) => {
    hotToast(message, options);
  };

  return { toast: hotToast, success, error, loading, custom };
};
