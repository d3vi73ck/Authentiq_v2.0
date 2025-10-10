'use client';

import { useTranslations } from 'next-intl';

import { useUserPermissions } from '@/libs/rbac-client';

export type NavigationItem = {
  href: string;
  label: string;
  roles: ('association' | 'member' | 'reviewer' | 'admin' | 'superadmin')[];
  icon: string;
};

// Server-side default navigation (for fallback)
export const defaultNavigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Home',
    roles: ['association', 'member', 'reviewer', 'admin', 'superadmin'],
    icon: 'Home',
  },
  {
    href: '/submissions/new',
    label: 'New Expense',
    roles: ['association', 'member', 'reviewer', 'admin', 'superadmin'],
    icon: 'PlusCircle',
  },
  {
    href: '/submissions',
    label: 'Submissions',
    roles: ['association', 'member', 'reviewer', 'admin', 'superadmin'],
    icon: 'FileText',
  },
  {
    href: '/dashboard/user-profile',
    label: 'User Profile',
    roles: ['association', 'member', 'reviewer', 'admin', 'superadmin'],
    icon: 'User',
  },
];

export const useNavigationMenu = () => {
  const t = useTranslations('DashboardLayout');
  const permissions = useUserPermissions();

  console.log('🔍 Navigation Menu - User permissions:', {
    role: permissions.role,
    canReview: permissions.canReview,
    isLoading: permissions.isLoading,
    timestamp: new Date().toISOString()
  });

  // If permissions are not loaded yet, return default items
  if (!permissions.role) {
    console.log('🔍 Navigation Menu - No role yet, returning default items');
    return defaultNavigationItems;
  }

  // Define all navigation items with their required roles
  const navigationItems: NavigationItem[] = [
    // 👥 Association & Member - Core workflow
    {
      href: '/dashboard',
      label: t('home'),
      roles: ['association', 'member', 'reviewer', 'admin', 'superadmin'],
      icon: 'Home',
    },
    {
      href: '/submissions/new',
      label: t('new_expense'),
      roles: ['association', 'member', 'reviewer', 'admin', 'superadmin'],
      icon: 'PlusCircle',
    },
    {
      href: '/submissions',
      label: t('submissions'),
      roles: ['association', 'member', 'reviewer', 'admin', 'superadmin'],
      icon: 'FileText',
    },
    
    // 👨‍⚖️ Reviewer / Admin / Superadmin - Review & Reporting
    {
      href: '/review',
      label: t('review'),
      roles: ['reviewer', 'admin', 'superadmin'],
      icon: 'ClipboardCheck',
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
    
    // 🏢 Admin Tools - Organization Management
    {
      href: '/admin/dashboard',
      label: t('admin_dashboard'),
      roles: ['admin', 'superadmin'],
      icon: 'LayoutDashboard',
    },
    {
      href: '/dashboard/organization-profile',
      label: t('organization_settings'),
      roles: ['admin', 'superadmin'],
      icon: 'Building',
    },
    {
      href: '/dashboard/organization/members',
      label: t('members'),
      roles: ['admin', 'superadmin'],
      icon: 'Users',
    },
    {
      href: '/admin/billing',
      label: t('admin_billing'),
      roles: ['admin', 'superadmin'],
      icon: 'CreditCard',
    },
    {
      href: '/admin/settings',
      label: t('admin_settings'),
      roles: ['admin', 'superadmin'],
      icon: 'Settings',
    },
    
    // 👤 User Profile - Common to all roles
    {
      href: '/dashboard/user-profile',
      label: t('user_profile'),
      roles: ['association', 'member', 'reviewer', 'admin', 'superadmin'],
      icon: 'User',
    },
  ];

  // Filter navigation items based on user role
  const filteredItems = navigationItems.filter(item => {
    const hasAccess = item.roles.includes(permissions.role!);
    console.log('🔍 Navigation Menu - Item access check:', {
      href: item.href,
      label: item.label,
      requiredRoles: item.roles,
      userRole: permissions.role,
      hasAccess
    });
    return hasAccess;
  });

  console.log('🔍 Navigation Menu - Final filtered items:', {
    totalItems: filteredItems.length,
    items: filteredItems.map(item => ({ href: item.href, label: item.label }))
  });

  return filteredItems;
};

// Export the hook as the default for backward compatibility
export default useNavigationMenu;