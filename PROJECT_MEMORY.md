han# Authentiq Project Memory

## Project Overview

**Authentiq** is a comprehensive expense justification platform designed specifically for NGOs (Non-Governmental Organizations). The platform provides multi-tenant architecture allowing NGOs to manage multiple organizations, projects, and teams under a single account with separate data isolation and role-based access controls.

### Business Purpose
- **Primary Goal**: Streamline expense validation processes for NGOs
- **Target Users**: NGO administrators, finance teams, project managers, and auditors
- **Key Value**: AI-powered document verification and multi-tenant management for expense compliance

### Core Features
1. **Multi-tenant Expense Management**
2. **Document Upload and Verification**
3. **AI-Powered OCR and Analysis**
4. **Role-Based Access Control**
5. **Multi-language Support (English/French)**
6. **Secure File Storage**
7. **Review and Approval Workflows**

## Technical Architecture

### Technology Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Drizzle ORM
- **Authentication**: Clerk (with multi-tenant support)
- **Database**: PostgreSQL (production), PGlite (development)
- **File Storage**: MinIO (S3-compatible object storage)
- **AI Processing**: OpenAI for document text extraction and analysis
- **Internationalization**: next-intl with Crowdin integration

### Database Schema

#### Core Entities

**Organization**
- `id` (text, primary key)
- `stripeCustomerId`, `stripeSubscriptionId` (billing integration)
- `name`, `subdomain` (multi-tenant identification)
- `createdAt`, `updatedAt` (timestamps)

**Submission**
- `id` (text, primary key, CUID)
- `organizationId` (foreign key)
- `type`, `title`, `amount`, `spentAt` (expense details)
- `status` (DRAFT, SUBMITTED, IN_REVIEW, APPROVED, REJECTED)
- `createdBy` (Clerk user ID)
- `createdAt` (timestamp)

**File**
- `id` (text, primary key, CUID)
- `submissionId` (foreign key)
- `kind` (FACTURE, CONTRAT, RECU, AUTRE)
- `objectKey` (MinIO storage key)
- `size`, `mime` (file metadata)
- `ocrText`, `aiData` (processing results)
- `createdAt` (timestamp)

**Comment**
- `id` (text, primary key, CUID)
- `submissionId` (foreign key)
- `userId` (Clerk user ID)
- `text`, `decision` (APPROVE, REJECT)
- `createdAt` (timestamp)

### Authentication & Authorization

**Clerk Integration**
- Multi-tenant user management
- Organization-based access control
- Role-based permissions (user, chef, admin, superadmin)

**RBAC Implementation**
- `canReview()`: reviewer, admin, superadmin roles
- `canManageOrganization()`: admin, superadmin roles
- Middleware-based route protection

### File Storage Architecture

**MinIO Configuration**
- Multi-tenant file isolation using path prefixes
- Organization-based bucket structure: `organizations/{orgId}/submissions/{submissionId}/`
- Secure file upload/download with presigned URLs
- File validation and type detection

**File Processing Pipeline**
1. File upload with validation
2. AI text extraction and analysis (OpenAI)
4. Background processing for performance

## Key Implementation Details

### Multi-Tenant Architecture

**Subdomain-Based Routing**
- Tenant identification from hostname
- Reserved subdomain protection (www, admin, app)
- Organization context propagation via headers

**Data Isolation**
- Database-level organization filtering
- File storage path isolation
- Role-based access enforcement

### Expense Types System

**Predefined Categories**
- Consultants/Prestataires
- Salaries
- Office Supplies
- Transport & Travel
- IT Equipment
- Training & Development

**Document Requirements**
- Each expense type has specific required documents
- Dynamic requirement display in UI
- Validation against required document types

### API Endpoints

**Submission Management**
- `GET /api/submissions` - List submissions with pagination
- `POST /api/submissions` - Create new submission
- `GET /api/submissions/[id]` - Get submission details
- `PATCH /api/submissions/[id]` - Update submission

**File Management**
- `POST /api/upload` - Upload file with OCR/AI processing
- `GET /api/upload` - List files for submission

**Review System**
- `GET /api/review` - List submissions pending review
- `POST /api/review` - Submit review decision with comment

### Frontend Components

**Core Pages**
- `/submissions` - Submission list with filtering
- `/submissions/new` - Create new expense submission
- `/submissions/[id]` - Submission details and file management
- `/review` - Review dashboard for approvers

**Key Components**
- `FileDrop` - Drag-and-drop file upload with validation
- `ReviewPanel` - Review interface with decision making
- `CommentSection` - Discussion and feedback system

## Development Status

### Completed Features
- ✅ Multi-tenant authentication with Clerk
- ✅ Expense submission creation and management
- ✅ File upload with MinIO integration
- ✅ AI text extraction and analysis with OpenAI
- ✅ Basic review workflow
- ✅ Multi-language support (English/French)
- ✅ Role-based access control
- ✅ Database schema and migrations

### In Progress
- 🔄 AI document analysis integration
- 🔄 Advanced review workflows
- 🔄 Email notifications
- 🔄 Reporting and analytics

### Planned Features
- 📋 Stripe billing integration
- 📋 Advanced OCR for PDF processing
- 📋 Document template system
- 📋 Audit trail and compliance reporting
- 📋 Mobile application

## Configuration & Environment

### Required Environment Variables
```env
# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# File Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=your-access-key
MINIO_SECRET_KEY=your-secret-key
MINIO_BUCKET=kifndirou

# Billing (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key
```

### Docker Development Setup
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: e6VH1N4nONTya98pn98MuCiybqyYGumAK
      POSTGRES_USER: kifndiro-user
      POSTGRES_DB: kifndirou-db
    ports: ["5437:5432"]

  minio:
    image: quay.io/minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: kifndiro-minio-user
      MINIO_ROOT_PASSWORD: PPUfiS3VcX5c32Vf9SbW4uGyai7gchXMy
    ports: ["9090:9000", "9091:9001"]
```

## Key Technical Decisions

### Why Drizzle ORM?
- Type-safe database operations
- Excellent TypeScript support
- Simple migration system
- Compatible with multiple databases

### Why Clerk for Authentication?
- Built-in multi-tenant support
- Comprehensive user management
- Security best practices
- Developer-friendly API

### Why MinIO for File Storage?
- S3-compatible API
- Self-hosted option
- Cost-effective for NGOs
- Strong security features

### Why Next.js App Router?
- Modern React patterns
- Built-in API routes
- Excellent performance
- Strong TypeScript support

## Recent Enhancements & Learnings

### RBAC System Implementation & Fixes

**Key Learnings:**
- **Role Mapping Consistency**: Implemented consistent role mapping between Clerk organization roles and application RBAC roles
  - `org:admin` → `admin`
  - `org:member` → `chef`
  - `org:basic_member` → `user`
- **Server-Client Parity**: Ensured identical role resolution logic between server-side ([`rbac.ts`](src/libs/rbac.ts:61)) and client-side ([`rbac-client.ts`](src/libs/rbac-client.ts:20)) implementations
- **Organization Membership Priority**: Prioritize organization membership roles over user metadata for accurate multi-tenant role assignment
- **Fallback Strategy**: Implemented graceful fallback to user role when organization context is unavailable

**Permission Consistency Rules:**
- Navigation menu items filtered based on user role permissions
- Page-level access control enforced through middleware and component guards
- Review permissions require `reviewer`, `admin`, or `superadmin` roles
- Organization management requires `admin` or `superadmin` roles

### Navigation Architecture & Mobile Responsiveness

**Sidebar Implementation:**
- **Collapsible Design**: Responsive sidebar that collapses on mobile and expands on desktop
- **Mobile-First Behavior**: Sidebar starts collapsed on mobile devices, expanded on desktop
- **Overlay Pattern**: Mobile overlay that closes sidebar when clicking outside
- **Icon-Only Mode**: Collapsed state shows only icons for space efficiency

**Navigation Menu Organization:**
- **Role-Based Filtering**: Dynamic menu filtering based on user permissions ([`NavigationMenu.tsx`](src/features/dashboard/NavigationMenu.tsx:143))
- **Logical Grouping**: Menu items organized into logical sections with visual separators
- **Progressive Disclosure**: Higher-privilege features revealed only to appropriate roles

**Mobile Responsiveness Patterns:**
- **Breakpoint-Aware**: Responsive behavior based on `window.innerWidth` thresholds
- **Touch-Friendly**: Larger touch targets and appropriate spacing for mobile interaction
- **Smooth Transitions**: CSS transitions for sidebar collapse/expand animations

### Internationalization Patterns & Error Handling

**Translation Structure:**
- **Namespace Organization**: Translations organized by feature areas (DashboardLayout, ErrorPages, etc.)
- **Consistent Keys**: Standardized key naming across all translation files
- **Dynamic Path Generation**: [`getI18nPath()`](src/utils/Helpers.ts) utility for locale-aware routing

**Error Page System:**
- **Custom Error Pages**: Implemented 404, 500, and generic error pages with consistent design
- **User-Friendly Messaging**: Clear, actionable error messages with appropriate tone
- **Development Details**: Error stack traces shown only in development environment
- **Support Integration**: Direct links to support channels and helpful navigation options

**Error Handling Patterns:**
- **Graceful Degradation**: Fallback to default navigation when permissions are loading
- **Loading States**: Clear loading indicators during permission resolution
- **Error Boundaries**: Comprehensive error boundaries with user-friendly fallback UI

### User Experience Patterns

**Permission-Driven UI:**
- **Progressive Enhancement**: UI elements appear/disappear based on user permissions
- **Contextual Navigation**: Navigation adapts to user's current organization context
- **Visual Hierarchy**: Clear visual separation between different permission levels

**Mobile Experience:**
- **Collapsible Navigation**: Space-efficient sidebar that adapts to screen size
- **Touch Optimization**: Appropriate touch targets and gesture support
- **Performance Optimization**: Efficient re-rendering and state management

**Accessibility Considerations:**
- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **Screen Reader Support**: Proper ARIA labels and semantic HTML structure
- **Focus Management**: Logical focus order and visible focus indicators

## Technical Architecture Updates

### New Components & Patterns

**RBAC System Architecture:**
- **Server-Side RBAC** ([`rbac.ts`](src/libs/rbac.ts)): Organization-based role resolution for server components and API routes
- **Client-Side RBAC** ([`rbac-client.ts`](src/libs/rbac-client.ts)): React hooks for client component permission checks
- **Unified Role Mapping**: Consistent role definitions across server and client

**Navigation System:**
- **Dashboard Sidebar** ([`DashboardSidebar.tsx`](src/features/dashboard/DashboardSidebar.tsx)): Responsive, collapsible navigation with organization context
- **Navigation Menu Hook** ([`NavigationMenu.tsx`](src/features/dashboard/NavigationMenu.tsx)): Dynamic menu generation based on user permissions
- **Icon Mapping System**: Centralized icon component mapping for consistent UI

**Error Handling Architecture:**
- **Custom Error Pages** ([`404.tsx`](src/app/[locale]/404/page.tsx), [`500.tsx`](src/app/[locale]/500/page.tsx), [`error.tsx`](src/app/[locale]/error.tsx)): Consistent error page design and behavior
- **Error Boundary Pattern**: Next.js error boundaries with custom error components
- **Development vs Production**: Different error detail exposure based on environment

### Authentication & Authorization Enhancements

**Role Mapping Implementation:**
```typescript
// Clerk organization roles to RBAC roles mapping
const roleMapping: Record<string, UserRole> = {
  'org:admin': 'admin',
  'org:member': 'chef',
  'org:basic_member': 'user'
}
```

**Permission Hierarchy:**
- **User**: Basic expense submission and viewing
- **Chef**: Review capabilities + user permissions
- **Admin**: Organization management + chef permissions
- **Superadmin**: System-wide administration + admin permissions

**Access Control Patterns:**
- **Route Protection**: Middleware-based route access control
- **Component-Level Guards**: Conditional rendering based on permissions
- **API Authorization**: Server-side permission validation in API routes

### Navigation Architecture

**Menu Structure:**
1. **Core Workflow** (All roles): Home, New Expense, Submissions
2. **Review & Reporting** (Chef+): Review, Reports, Export
3. **Admin Tools** (Admin+): Admin Dashboard, Organization Settings, Members, Billing
4. **User Profile** (All roles): User Profile

**Mobile Behavior:**
- **Auto-Collapse**: Sidebar automatically collapses on mobile devices
- **Overlay Backdrop**: Click outside to close expanded sidebar on mobile
- **Smooth Transitions**: CSS transitions for responsive state changes

**Permission Consistency:**
- Navigation menu filtering matches page-level access controls
- Role-based menu item visibility ensures users only see accessible features
- Fallback to default navigation during permission loading

### Error Handling System

**Error Page Types:**
- **404 Not Found**: Custom page with helpful links and navigation options
- **500 Internal Server Error**: Service status information and support contacts
- **Generic Error**: Fallback error page with retry functionality

**Error Recovery Patterns:**
- **Retry Mechanism**: "Try Again" buttons for recoverable errors
- **Alternative Navigation**: Multiple navigation options for error recovery
- **Support Integration**: Direct access to support channels from error pages

**Development Support:**
- **Error Details**: Stack traces and error information in development mode
- **Debug Information**: Comprehensive logging for troubleshooting
- **Error Tracking**: Integration with error monitoring services

## Development Status Updates

### Completed Features
- ✅ Multi-tenant authentication with Clerk
- ✅ Expense submission creation and management
- ✅ File upload with MinIO integration
- ✅ AI text extraction and analysis with OpenAI
- ✅ Basic review workflow
- ✅ Multi-language support (English/French)
- ✅ Role-based access control
- ✅ Database schema and migrations
- ✅ **RBAC system with consistent role mapping**
- ✅ **Responsive sidebar navigation with mobile support**
- ✅ **Custom error pages (404, 500, generic)**
- ✅ **Internationalization audit and consistency fixes**
- ✅ **Permission consistency between navigation and page access**
- ✅ **Mobile responsiveness patterns and fixes**
- ✅ **Navigation menu organization and UX patterns**
- ✅ **PDF-to-image conversion for OpenAI Vision API compatibility**
- ✅ **File type validation with clear error messages**
- ✅ **OpenAI API 400 Bad Request error resolution**

### In Progress
- 🔄 AI document analysis integration
- 🔄 Advanced review workflows
- 🔄 Email notifications
- 🔄 Reporting and analytics

### Planned Features
- 📋 Stripe billing integration
- 📋 Advanced OCR for PDF processing
- 📋 Document template system
- 📋 Audit trail and compliance reporting
- 📋 Mobile application

## Recent Technical Fixes

### OpenAI API 400 Bad Request Error Resolution

**Problem**: OpenAI Vision API was returning "400 Bad Request - Invalid MIME type. Only image types are supported" when processing PDF files.

**Root Cause**: The system was attempting to send PDF files directly to OpenAI Vision API, which only accepts image formats (JPEG, PNG, GIF, WEBP).

**Solution Implemented**:
1. **PDF-to-Image Conversion**: Added automatic conversion of PDF documents to JPEG images using the `sharp` library
2. **File Type Detection**: Enhanced MIME type validation with clear error messages for unsupported file types
3. **Fallback Processing**: Graceful handling of conversion failures with fallback to direct PDF processing
4. **Error Handling**: Comprehensive error logging and user-friendly error messages

**Technical Implementation**:
- **Conversion Function**: [`convertPdfToImage()`](src/services/ai.ts:174) function using sharp with 150 DPI and 80% quality
- **Processing Logic**: PDF files are automatically converted to JPEG before being sent to OpenAI Vision API
- **Validation**: Enhanced file type validation with clear error messages for unsupported types
- **Logging**: Comprehensive logging for conversion success/failure and processing details

**Supported File Types**:
- **Images**: JPEG, JPG, PNG, GIF, WEBP (processed directly)
- **Documents**: PDF (automatically converted to JPEG)
- **Unsupported**: All other file types with clear error messages

## Lessons Learned & Best Practices

### Multi-Tenant Security
- Always validate organization context in API routes
- Use database-level filtering for data isolation
- Implement proper RBAC for different user roles
- **Ensure role mapping consistency between authentication provider and application**

### File Processing
- Use background processing for OCR/AI to avoid blocking requests
- Implement proper file validation and sanitization
- Store processing results for future reference
- **PDF-to-Image Conversion**: Automatic conversion of PDF documents to JPEG images for OpenAI Vision API compatibility
- **File Type Detection**: Comprehensive MIME type validation with clear error messages
- **Fallback Processing**: Graceful handling of conversion failures with fallback to direct processing

### Performance Considerations
- Implement pagination for large datasets
- Use efficient database indexing
- Cache frequently accessed data
- Optimize file upload/download with streaming
- **Implement responsive design with mobile-first approach**
- **Use CSS transitions for smooth UI state changes**

### Development Workflow
- Use TypeScript for type safety
- Implement comprehensive error handling
- Follow consistent code formatting
- Use automated testing and CI/CD
- **Maintain server-client parity for critical business logic**
- **Implement proper loading states for async operations**
- **Use semantic versioning for component libraries**

## Integration Points

### External Services
- **Clerk**: Authentication and user management
- **Stripe**: Subscription billing
- **MinIO**: File storage
- **OpenAI**: AI document analysis (planned)
- **Crowdin**: Translation management

### API Design Principles
- RESTful endpoints with consistent error handling
- Type-safe request/response validation
- Proper authentication and authorization
- Comprehensive logging and monitoring

## Security Considerations

### Data Protection
- Bank-level encryption for sensitive data
- Secure document storage with access controls
- Audit trails for compliance
- GDPR and international data protection compliance

### Access Control
- Multi-level role-based permissions
- Organization data isolation
- Secure file access with presigned URLs
- Regular security audits

This document serves as the comprehensive memory for the Authentiq project, capturing all key technical decisions, architecture details, and implementation status for future reference and development continuity.