import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from './utils/AppConfig';

const intlMiddleware = createMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
});

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
  '/admin(.*)',
  '/:locale/admin(.*)',
  '/api(.*)',
  '/:locale/api(.*)',
]);

// Reserved subdomains that should not be used as tenant identifiers
const RESERVED_SUBDOMAINS = new Set(['www', 'admin', 'app']);

/**
 * Extracts tenant subdomain from hostname
 */
function getTenantFromHost(hostname: string): string | null {
  if (!hostname) return null;
  
  const cleanHostname = hostname.split(':')[0];
  if (!cleanHostname) return null;
  
  const parts = cleanHostname.split('.');

  // For subdomain-based routing, the first part should be the tenant
  if (parts.length >= 3) {
    const potentialTenant = parts[0]?.toLowerCase();

    // Check if it's a reserved subdomain
    if (!potentialTenant || RESERVED_SUBDOMAINS.has(potentialTenant)) {
      return null;
    }

    // Validate tenant subdomain format (alphanumeric, hyphens, underscores)
    const tenantRegex = /^[a-z0-9-_]+$/;
    if (tenantRegex.test(potentialTenant)) {
      return potentialTenant;
    }
  }

  return null;
}

/**
 * Checks if the current request is for the main domain (no tenant)
 */
function isMainDomain(hostname: string): boolean {
  if (!hostname) return false;
  
  const cleanHostname = hostname.split(':')[0];
  if (!cleanHostname) return false;
  
  const parts = cleanHostname.split('.');

  // Main domain should have exactly 2 parts (domain.com) or 3 parts with www (www.domain.com)
  if (parts.length === 2) {
    return true;
  }

  if (parts.length === 3 && parts[0] === 'www') {
    return true;
  }

  return false;
}

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  const hostname = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // Extract tenant from hostname for subdomain-based routing
  const tenantSubdomain = getTenantFromHost(hostname);

  // Handle tenant-specific routes with Clerk authentication
  if (
    request.nextUrl.pathname.includes('/sign-in')
    || request.nextUrl.pathname.includes('/sign-up')
    || isProtectedRoute(request)
    || tenantSubdomain // Include tenant-specific routes
  ) {
    return clerkMiddleware(async (auth, req) => {
      const currentHostname = req.headers.get('host') || '';
      const currentTenantSubdomain = getTenantFromHost(currentHostname);

      // Handle authentication for protected routes
      if (isProtectedRoute(req)) {
        const locale
          = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';

        const signInUrl = new URL(`${locale}/sign-in`, req.url);

        await auth.protect({
          unauthenticatedUrl: signInUrl.toString(),
        });
      }

      const authObj = await auth();

      // If user is authenticated but has no organization, redirect to organization selection
      if (
        authObj.userId
        && !authObj.orgId
        && req.nextUrl.pathname.includes('/dashboard')
        && !req.nextUrl.pathname.endsWith('/organization-selection')
      ) {
        const orgSelection = new URL(
          '/onboarding/organization-selection',
          req.url,
        );

        return NextResponse.redirect(orgSelection);
      }

      // For API routes, skip locale prefixing but still handle authentication
      if (req.nextUrl.pathname.startsWith('/api/')) {
        const response = NextResponse.next();
        
        // Add tenant context to request headers for tenant-specific routes
        if (currentTenantSubdomain) {
          response.headers.set('x-tenant-subdomain', currentTenantSubdomain);
          
          // If user is authenticated, also set the organization context
          if (authObj.orgId) {
            response.headers.set('x-organization-id', authObj.orgId);
          }
        }
        
        return response;
      }

      // Add tenant context to request headers for tenant-specific routes
      if (currentTenantSubdomain) {
        const response = intlMiddleware(req);
        response.headers.set('x-tenant-subdomain', currentTenantSubdomain);
        
        // If user is authenticated, also set the organization context
        if (authObj.orgId) {
          response.headers.set('x-organization-id', authObj.orgId);
        }
        
        return response;
      }

      return intlMiddleware(req);
    })(request, event);
  }

  // For non-protected API routes, skip locale prefixing
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next|monitoring).*)', '/', '/(api|trpc)(.*)'], // Also exclude tunnelRoute used in Sentry from the matcher
};
