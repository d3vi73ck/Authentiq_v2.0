'use client';

import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home,
  FileText,
  PlusCircle,
  ClipboardCheck,
  LayoutDashboard,
  BarChart3,
  Download,
  Settings,
  CreditCard,
  Users,
  Building,
  User,
} from 'lucide-react';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/templates/Logo';
import { getI18nPath } from '@/utils/Helpers';
import { useNavigationMenu } from './NavigationMenu';

export const DashboardSidebar = () => {
  const locale = useLocale();
  const menu = useNavigationMenu();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Set initial state based on screen size after component mounts
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      
      // On mobile, start collapsed; on desktop, start expanded
      if (isMobile && !isCollapsed) {
        setIsCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    // Add resize listener to handle screen size changes
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array to run only on mount

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside
        className={`
          bg-background border-r border-border transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link 
            href="/dashboard" 
            className={`flex items-center gap-2 transition-opacity ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}
          >
            <Logo />
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="h-8 w-8 p-0"
          >
            <svg
              className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </Button>
        </div>

        {/* Organization Switcher */}
        <div className={`p-4 border-b border-border ${isCollapsed ? 'hidden' : 'block'}`}>
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
                organizationSwitcherTrigger: 'w-full justify-start',
              },
            }}
          />
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menu.map((item, index) => {
              const isActive = pathname.endsWith(item.href);
              
              // Check if we need to add a separator before this item
              const shouldAddSeparator = () => {
                if (index === 0) return false; // Never add separator before first item
                
                const currentItem = item;
                const previousItem = menu[index - 1];
                
                // Add separator when transitioning between different role groups
                // Core workflow (user, chef, admin, superadmin) -> Review & Reporting (chef, admin, superadmin)
                if (previousItem?.roles.includes('user') && !currentItem.roles.includes('user')) {
                  return true;
                }
                
                // Add separator when transitioning from Review & Reporting to Admin Tools
                if (previousItem?.roles.includes('chef') && !currentItem.roles.includes('chef')) {
                  return true;
                }
                
                // Add separator before User Profile (common to all roles)
                if (currentItem.href === '/dashboard/user-profile' && previousItem?.href !== '/dashboard/user-profile') {
                  return true;
                }
                
                return false;
              };

              // Map icon names to actual Lucide components
              const getIconComponent = (iconName: string) => {
                const iconProps = { className: 'w-4 h-4', size: 16 };
                switch (iconName) {
                  case 'Home':
                    return <Home {...iconProps} />;
                  case 'FileText':
                    return <FileText {...iconProps} />;
                  case 'PlusCircle':
                    return <PlusCircle {...iconProps} />;
                  case 'ClipboardCheck':
                    return <ClipboardCheck {...iconProps} />;
                  case 'LayoutDashboard':
                    return <LayoutDashboard {...iconProps} />;
                  case 'BarChart3':
                    return <BarChart3 {...iconProps} />;
                  case 'Download':
                    return <Download {...iconProps} />;
                  case 'Settings':
                    return <Settings {...iconProps} />;
                  case 'CreditCard':
                    return <CreditCard {...iconProps} />;
                  case 'Users':
                    return <Users {...iconProps} />;
                  case 'Building':
                    return <Building {...iconProps} />;
                  case 'User':
                    return <User {...iconProps} />;
                  default:
                    return <div className="w-2 h-2 bg-current rounded-full" />;
                }
              };

              return (
                <>
                  {shouldAddSeparator() && (
                    <li className={`py-2 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                      <Separator />
                    </li>
                  )}
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
                        transition-colors hover:bg-accent hover:text-accent-foreground
                        ${isCollapsed ? 'justify-center' : ''}
                        ${isActive ? 'bg-accent text-accent-foreground' : ''}
                      `}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        {getIconComponent(item.icon)}
                      </div>
                      <span className={isCollapsed ? 'hidden' : 'block'}>
                        {item.label}
                      </span>
                    </Link>
                  </li>
                </>
              );
            })}
          </ul>
        </nav>

        {/* Footer with User Controls */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Locale Switcher */}
          <div className={isCollapsed ? 'hidden' : 'block'}>
            <LocaleSwitcher />
          </div>

          {/* User Button */}
          <div className="flex items-center gap-3">
            <UserButton
              userProfileMode="navigation"
              userProfileUrl="/dashboard/user-profile"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                },
              }}
            />
            <div className={isCollapsed ? 'hidden' : 'flex-1'}>
              <p className="text-sm font-medium truncate">User Profile</p>
              <p className="text-xs text-muted-foreground truncate">Manage account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay - Only show when sidebar is expanded on mobile */}
      {!isCollapsed && (
        <div
          className="
            lg:hidden fixed inset-0 bg-background/80 z-40
            transition-opacity duration-300 opacity-100 pointer-events-auto
          "
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </div>
  );
};