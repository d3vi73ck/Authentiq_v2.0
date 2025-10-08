# Authentiq Development Guide

## Quick Start

### Prerequisites
- Node.js 20+ and npm
- Docker and Docker Compose
- Git

### Initial Setup
```bash
# Clone the repository
git clone <repository-url>
cd kifndirou

# Install dependencies
cd App
npm install

# Start development services
docker-compose up -d

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Development Environment Setup

### 1. Environment Configuration

Copy the example environment file and configure your local settings:

```bash
# Copy environment template
cp .env.example .env.local

# Edit the file with your configuration
nano .env.local
```

**Required Environment Variables:**
```env
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Database
DATABASE_URL=postgresql://kifndiro-user:e6VH1N4nONTya98pn98MuCiybqyYGumAK@localhost:5437/kifndirou-db

# File Storage (MinIO)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=kifndiro-minio-user
MINIO_SECRET_KEY=PPUfiS3VcX5c32Vf9SbW4uGyai7gchXMy
MINIO_BUCKET=kifndirou
MINIO_USE_SSL=false

# Optional: Billing (Stripe)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pub_key
```

### 2. Authentication Setup (Clerk)

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application in the Clerk Dashboard
3. Enable Organization management:
   - Navigate to "Organization management" > "Settings"
   - Enable "Allow organizations"
4. Copy your API keys to `.env.local`

### 3. Database Setup

The project uses Docker Compose for local development:

```bash
# Start database and MinIO
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Services:**
- **PostgreSQL**: `localhost:5437`
- **MinIO Console**: `http://localhost:9091` (username: `kifndiro-minio-user`, password: `PPUfiS3VcX5c32Vf9SbW4uGyai7gchXMy`)

### 4. Database Migrations

Database migrations are automatically applied during development. To manually generate migrations:

```bash
# Generate new migration after schema changes
npm run db:generate

# Apply migrations manually (if needed)
npm run db:migrate

# Open database studio for exploration
npm run db:studio
```

## Development Workflow

### Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm run start

# Build with bundle analyzer
npm run build-stats
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

### Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Type checking
npm run check-types

# Formatting (via Prettier)
npm run format
```

## Project Structure

```
kifndirou/
├── App/                          # Main application
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── [locale]/         # Internationalized routes
│   │   │   │   ├── (auth)/       # Authenticated routes
│   │   │   │   └── (unauth)/     # Public routes
│   │   │   └── api/              # API routes
│   │   ├── components/           # Reusable UI components
│   │   ├── features/             # Feature-specific components
│   │   ├── libs/                 # Utility libraries
│   │   ├── models/               # Database schema
│   │   ├── services/             # Business logic services
│   │   └── utils/                # Helper utilities
│   ├── migrations/               # Database migrations
│   └── public/                   # Static assets
├── docker-compose.yml            # Development services
└── PROJECT_MEMORY.md             # Project documentation
```

## Key Development Concepts

### Multi-Tenant Architecture

**Organization Context**
- All authenticated requests include organization context via Clerk
- Database queries automatically filter by organization ID
- File storage uses organization-based path structure

**Subdomain Routing**
- Organizations can be accessed via subdomains: `org-name.localhost:3000`
- Middleware handles tenant identification and routing

### Authentication & Authorization

**Clerk Integration**
- User authentication handled by Clerk
- Organization membership managed via Clerk
- Role-based permissions implemented in `src/libs/rbac.ts`

**RBAC Implementation**
```typescript
// Server-side permission checks
import { canReview, canManageOrganization } from '@/libs/rbac'

// Check if user can review submissions
const canUserReview = await canReview()

// Check if user can manage organization
const canUserManageOrg = await canManageOrganization()
```

### File Management

**Upload Process**
1. File validation (type, size, security)
2. MinIO storage with organization isolation
3. Database record creation
4. Background OCR/AI processing

**File Storage Structure**
```
organizations/
  └── {organizationId}/
      └── submissions/
          └── {submissionId}/
              └── {timestamp}_{filename}
```

### API Development

**Route Structure**
- All API routes are in `src/app/api/`
- Use Next.js Route Handlers
- Implement proper error handling and validation

**Example API Route**
```typescript
// src/app/api/submissions/route.ts
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth()
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Implementation...
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Database Operations

### Using Drizzle ORM

**Query Examples**
```typescript
import { db } from '@/libs/DB'
import { submissionSchema, fileSchema } from '@/models/Schema'
import { eq, and, desc } from 'drizzle-orm'

// Select submissions for organization
const submissions = await db
  .select()
  .from(submissionSchema)
  .where(eq(submissionSchema.organizationId, orgId))
  .orderBy(desc(submissionSchema.createdAt))

// Insert new submission
const [submission] = await db
  .insert(submissionSchema)
  .values({
    organizationId: orgId,
    type: 'consultants',
    status: 'DRAFT',
    createdBy: userId
  })
  .returning()
```

### Schema Modifications

1. Update `src/models/Schema.ts`
2. Generate migration: `npm run db:generate`
3. Migration is automatically applied on next server start

## Frontend Development

### Component Structure

**UI Components**
- Located in `src/components/ui/` (Shadcn UI)
- Consistent styling with Tailwind CSS
- Type-safe with TypeScript

**Feature Components**
- Located in `src/features/`
- Business logic and state management
- Composed of multiple UI components

### Internationalization

**Adding Translations**
1. Update `src/locales/en.json` and `src/locales/fr.json`
2. Use in components:
```typescript
import { useTranslations } from 'next-intl'

const t = useTranslations('Submissions')
return <h1>{t('submissions_title')}</h1>
```

### Form Handling

**React Hook Form Integration**
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const formSchema = z.object({
  type: z.string().min(1),
  title: z.string().optional(),
  amount: z.number().optional(),
})

const form = useForm({
  resolver: zodResolver(formSchema),
  defaultValues: { /* ... */ }
})
```

## Testing Strategy

### Unit Tests
- Located alongside source files
- Use Vitest and React Testing Library
- Test components, utilities, and services

### Integration Tests
- API route testing
- Database operation testing
- Authentication flow testing

### E2E Tests
- Playwright for browser automation
- User journey testing
- Visual regression testing

## Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Variables for Production
- Set all required environment variables
- Configure production database URL
- Set up production MinIO instance
- Configure production Clerk application

### Database Migrations in Production
- Migrations run automatically during build
- Ensure `DATABASE_URL` is set in production environment

## Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify Docker containers are running: `docker-compose ps`
- Check `DATABASE_URL` in `.env.local`
- Ensure ports 5437 (PostgreSQL) and 9090 (MinIO) are available

**Authentication Problems**
- Verify Clerk application configuration
- Check organization settings in Clerk Dashboard
- Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set

**File Upload Failures**
- Verify MinIO is running and accessible
- Check MinIO credentials in environment variables
- Ensure bucket exists and has proper permissions

### Debugging Tips

**Server Logs**
- Check console output during development
- Use `console.log` strategically (remove in production)
- Implement proper error logging

**Database Inspection**
```bash
# Open database studio
npm run db:studio

# Connect directly to PostgreSQL
psql -h localhost -p 5437 -U kifndiro-user -d kifndirou-db
```

**MinIO Console**
- Access at `http://localhost:9091`
- Use credentials from `docker-compose.yml`
- Inspect buckets and file structure

## Development Best Practices

### Code Standards
- Use TypeScript for type safety
- Follow ESLint and Prettier configuration
- Write meaningful commit messages
- Add tests for new functionality

### Security Considerations
- Always validate organization context
- Implement proper input validation
- Use parameterized queries to prevent SQL injection
- Sanitize file uploads

### Performance Optimization
- Implement pagination for large datasets
- Use efficient database queries with proper indexing
- Optimize file processing with background jobs
- Cache frequently accessed data

This guide provides comprehensive instructions for setting up, developing, and maintaining the Authentiq application. Refer to specific sections for detailed implementation guidance.