import { useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export interface RecaptchaResult {
  token: string | null;
  error?: {
    message: string;
    code?: string;
  } | null;
}

export const useRecaptcha = () => {
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getRecaptchaToken = useCallback(
    async (action: string = 'checkout'): Promise<RecaptchaResult> => {
      if (!executeRecaptcha) {
        console.error('reCAPTCHA not initialized');
        return {
          token: null,
          error: {
            message: 'reCAPTCHA not initialized',
            code: 'not_initialized',
          },
        };
      }

      try {
        // Execute reCaptcha with the specified action
        const token = await executeRecaptcha(action);
        return { token };
      } catch (error) {
        console.error('reCAPTCHA execution failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown reCAPTCHA error';

        return {
          token: null,
          error: {
            message: errorMessage,
            code: 'execution_failed',
          },
        };
      }
    },
    [executeRecaptcha]
  );

  return { getRecaptchaToken };
};
