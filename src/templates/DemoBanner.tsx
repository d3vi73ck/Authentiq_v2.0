import Link from 'next/link';

import { StickyBanner } from '@/features/landing/StickyBanner';

export const DemoBanner = () => (
  <StickyBanner>
    KifNdirou - 
    {' '}
    <Link href="/sign-up">Demo</Link>
  </StickyBanner>
);
