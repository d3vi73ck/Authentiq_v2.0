'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

import ErrorPage from '@/app/[locale]/error';

export default function GlobalError(props: {
  error: Error & { digest?: string };
  params: { locale: string };
}) {
  useEffect(() => {
    Sentry.captureException(props.error);
  }, [props.error]);

  return (
    <html lang={props.params.locale}>
      <body>
        {/* Use our custom error page component instead of Next.js default */}
        <ErrorPage
          error={props.error}
          reset={() => window.location.reload()}
          locale={props.params.locale}
        />
      </body>
    </html>
  );
}
