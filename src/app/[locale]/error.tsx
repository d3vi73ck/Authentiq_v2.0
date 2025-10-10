'use client';

import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { getI18nPath } from '@/utils/Helpers';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
  locale?: string;
}

export default function ErrorPage({ error, reset, locale = 'en' }: ErrorPageProps) {
  const t = useTranslations('ErrorPages.generic');

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error caught by error boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            {t('title')}
          </h2>
          <p className="text-muted-foreground mb-4">
            {t('description')}
          </p>
          <p className="text-sm text-muted-foreground/70">
            {t('suggestion')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href={getI18nPath('/', locale)}>
              {t('go_home')}
            </Link>
          </Button>
          <Button variant="outline" onClick={reset}>
            {t('try_again')}
          </Button>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-6 border-t border-border">
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground mb-2">
                {t('error_details')}
              </summary>
              <div className="bg-muted/50 rounded-lg p-4 text-xs font-mono overflow-x-auto">
                <div className="mb-2">
                  <strong>Message:</strong> {error.message}
                </div>
                {error.digest && (
                  <div>
                    <strong>Digest:</strong> {error.digest}
                  </div>
                )}
                <div className="mt-2">
                  <strong>Stack:</strong>
                  <pre className="mt-1 whitespace-pre-wrap">
                    {error.stack}
                  </pre>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Support Information */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground">
            {t('support_info')}{' '}
            <Link
              href="mailto:support@authentiq.com"
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('support_info_link')}
            </Link>
            {' '}{t('support_info_suffix')}
          </p>
        </div>
      </div>
    </div>
  );
}