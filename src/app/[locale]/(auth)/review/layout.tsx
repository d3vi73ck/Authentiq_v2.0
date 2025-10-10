import { getTranslations } from 'next-intl/server';

import { DashboardSidebar } from '@/features/dashboard/DashboardSidebar';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Review',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default function ReviewLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      
      {/* Main content area */}
      <main className="flex-1 overflow-auto bg-muted">
        <div className="p-6">
          {props.children}
        </div>
      </main>
    </div>
  );
}

export const dynamic = 'force-dynamic';