import { useTranslations } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';
import Link from 'next/link';

import { getI18nPath } from '@/utils/Helpers';
import { Button } from '@/components/ui/button';

export default function NotFoundPage(props: { params: { locale: string } }) {
  unstable_setRequestLocale(props.params.locale);
  const t = useTranslations('ErrorPages.404');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Code */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
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
          <Button variant="outline" asChild>
            <Link href={getI18nPath('/dashboard', props.params.locale)}>
              {t('try_again')}
            </Link>
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">
            {t('helpful_links')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={getI18nPath('/submissions', props.params.locale)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('submissions_link')}
            </Link>
            <Link
              href={getI18nPath('/review', props.params.locale)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('review_link')}
            </Link>
            <Link
              href={getI18nPath('/dashboard', props.params.locale)}
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t('dashboard_link')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}