import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { getI18nPath } from '@/utils/Helpers';
import { Button } from '@/components/ui/button';

export default function InternalServerErrorPage(props: { params: { locale: string } }) {
  unstable_setRequestLocale(props.params.locale);
  const t = useTranslations('ErrorPages.500');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-muted-foreground/20">500</h1>
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
            <Link href={getI18nPath('/', props.params.locale)}>
              {t('go_home')}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('try_again')}
          </Button>
        </div>

        {/* Status Information */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium text-foreground">
                {t('service_status')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('team_notified')}
            </p>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground">
            {t('contact_support')}{' '}
            <Link
              href="mailto:support@authentiq.com"
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('contact_support_link')}
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}