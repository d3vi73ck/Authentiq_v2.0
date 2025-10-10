'use client';

import { useTranslations } from 'next-intl';

import { useUserPermissions } from '@/libs/rbac-client';

export type NavigationItem = {
  href: string;
  label: string;
  roles: ('user' | 'chef' | 'admin' | 'superadmin')[];
  icon: string;
};

// Server-side default navigation (for fallback)
export const defaultNavigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Home',
    roles: ['user', 'chef', 'admin', 'superadmin'],
    icon: 'Home',
  },
  {
    href: '/submissions',
    label: 'Submissions',
    roles: ['user', 'chef', 'admin', 'superadmin'],
    icon: 'FileText',
  },
  {
    href: '/submissions/new',
    label: 'New Expense',
    roles: ['user', 'chef', 'admin', 'superadmin'],
    icon: 'PlusCircle',
  },
  {
    href: '/dashboard/user-profile',
    label: 'User Profile',
    roles: ['user', 'chef', 'admin', 'superadmin'],
    icon: 'User',
  },
];

export const useNavigationMenu = () => {
  const t = useTranslations('DashboardLayout');
  const permissions = useUserPermissions();

  // If permissions are not loaded yet, return default items
  if (!permissions.role) {
    return defaultNavigationItems;
  }

  // Define all navigation items with their required roles
  const navigationItems: NavigationItem[] = [
    {
      href: '/dashboard',
      label: t('home'),
      roles: ['user', 'chef', 'admin', 'superadmin'],
      icon: 'Home',
    },
    {
      href: '/submissions',
      label: t('submissions'),
      roles: ['user', 'chef', 'admin', 'superadmin'],
      icon: 'FileText',
    },
    {
      href: '/submissions/new',
      label: t('new_expense'),
      roles: ['user', 'chef', 'admin', 'superadmin'],
      icon: 'PlusCircle',
    },
    {
      href: '/review',
      label: t('review'),
      roles: ['chef', 'admin', 'superadmin'],
      icon: 'ClipboardCheck',
    },
    {
      href: '/admin/dashboard',
      label: t('admin_dashboard'),
      roles: ['admin', 'superadmin'],
      icon: 'LayoutDashboard',
    },
    {
      href: '/admin/reports',
      label: t('reports'),
      roles: ['admin', 'superadmin'],
      icon: 'BarChart3',
    },
    {
      href: '/admin/reports/export',
      label: t('export_reports'),
      roles: ['admin', 'superadmin'],
      icon: 'Download',
    },
    {
      href: '/admin/settings',
      label: t('admin_settings'),
      roles: ['admin', 'superadmin'],
      icon: 'Settings',
    },
    {
      href: '/admin/billing',
      label: t('admin_billing'),
      roles: ['admin', 'superadmin'],
      icon: 'CreditCard',
    },
    {
      href: '/dashboard/organization/members',
      label: t('members'),
      roles: ['admin', 'superadmin'],
      icon: 'Users',
    },
    {
      href: '/dashboard/organization-profile',
      label: t('organization_settings'),
      roles: ['admin', 'superadmin'],
      icon: 'Building',
    },
    {
      href: '/dashboard/user-profile',
      label: t('user_profile'),
      roles: ['user', 'chef', 'admin', 'superadmin'],
      icon: 'User',
    },
  ];

  // Filter navigation items based on user role
  const filteredItems = navigationItems.filter(item => {
    return item.roles.includes(permissions.role!);
  });

  return filteredItems;
};

// Export the hook as the default for backward compatibility
export default useNavigationMenu;