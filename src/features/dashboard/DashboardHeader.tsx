'use client';

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useLocale } from 'next-intl';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/templates/Logo';
import { getI18nPath } from '@/utils/Helpers';

export const DashboardHeader = () => {
  const locale = useLocale();

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Logo />
        </Link>

        <svg
          className="size-6 stroke-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path stroke="none" d="M0 0h24v24H0z" />
          <path d="M17 5 7 19" />
        </svg>

        <OrganizationSwitcher
          organizationProfileMode="navigation"
          organizationProfileUrl={getI18nPath(
            '/dashboard/organization-profile',
            locale,
          )}
          afterCreateOrganizationUrl="/dashboard"
          hidePersonal
          skipInvitationScreen
          appearance={{
            elements: {
              organizationSwitcherTrigger: 'max-w-28 sm:max-w-52',
            },
          }}
        />
      </div>

      <div className="flex items-center gap-x-3">
        <LocaleSwitcher />
        
        <Separator orientation="vertical" className="h-6" />
        
        <UserButton
          userProfileMode="navigation"
          userProfileUrl="/dashboard/user-profile"
          appearance={{
            elements: {
              rootBox: 'px-2 py-1.5',
            },
          }}
        />
      </div>
    </div>
  );
};
