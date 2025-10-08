# Authentiq Project Memory

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
- **OCR Processing**: Tesseract.js
- **AI Analysis**: OpenAI integration (planned)
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
- `canReview()`: chef, admin, superadmin roles
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
2. OCR text extraction (Tesseract.js)
3. AI analysis (planned)
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
- ✅ OCR text extraction with Tesseract.js
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

## Lessons Learned & Best Practices

### Multi-Tenant Security
- Always validate organization context in API routes
- Use database-level filtering for data isolation
- Implement proper RBAC for different user roles

### File Processing
- Use background processing for OCR/AI to avoid blocking requests
- Implement proper file validation and sanitization
- Store processing results for future reference

### Performance Considerations
- Implement pagination for large datasets
- Use efficient database indexing
- Cache frequently accessed data
- Optimize file upload/download with streaming

### Development Workflow
- Use TypeScript for type safety
- Implement comprehensive error handling
- Follow consistent code formatting
- Use automated testing and CI/CD

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