import {
  bigint,
  boolean,
  decimal,
  integer,
  json,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

// Need a database for production? Check out https://www.prisma.io/?via=saasboilerplatesrc
// Tested and compatible with Next.js Boilerplate

// Enums for Kifndirou application
export const submissionStatusEnum = pgEnum('submission_status', [
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
]);

export const fileKindEnum = pgEnum('file_kind', [
  'FACTURE',
  'CONTRAT',
  'RECU',
  'AUTRE',
]);

export const decisionEnum = pgEnum('decision', [
  'APPROVE',
  'REJECT',
]);

export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    stripeSubscriptionCurrentPeriodEnd: bigint(
      'stripe_subscription_current_period_end',
      { mode: 'number' },
    ),
    // Kifndirou specific fields
    name: text('name').notNull(),
    subdomain: text('subdomain').unique().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(
        table.stripeCustomerId,
      ),
      subdomainIdx: uniqueIndex('organization_subdomain_idx').on(table.subdomain),
    };
  },
);

export const submissionSchema = pgTable(
  'submission',
  {
    id: text('id').primaryKey().default('cuid()'),
    organizationId: text('organization_id').notNull().references(() => organizationSchema.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title'),
    amount: decimal('amount', { precision: 10, scale: 2 }),
    spentAt: timestamp('spent_at', { mode: 'date' }),
    status: submissionStatusEnum('status').default('DRAFT').notNull(),
    // Clerk user ID instead of custom user management
    createdBy: text('created_by').notNull(), // Clerk user ID
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      organizationIdIdx: index('submission_organization_id_idx').on(table.organizationId),
      statusIdx: index('submission_status_idx').on(table.status),
      createdAtIdx: index('submission_created_at_idx').on(table.createdAt),
    };
  },
);

export const fileSchema = pgTable(
  'file',
  {
    id: text('id').primaryKey().default('cuid()'),
    submissionId: text('submission_id').notNull().references(() => submissionSchema.id, { onDelete: 'cascade' }),
    kind: fileKindEnum('kind').notNull(),
    objectKey: text('object_key').notNull(), // MinIO object key
    size: integer('size').notNull(),
    mime: text('mime').notNull(),
    ocrText: text('ocr_text'),
    aiData: json('ai_data'), // AI analysis results
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      submissionIdIdx: index('file_submission_id_idx').on(table.submissionId),
      objectKeyIdx: index('file_object_key_idx').on(table.objectKey),
    };
  },
);

export const commentSchema = pgTable(
  'comment',
  {
    id: text('id').primaryKey().default('cuid()'),
    submissionId: text('submission_id').notNull().references(() => submissionSchema.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(), // Clerk user ID
    text: text('text').notNull(),
    decision: decisionEnum('decision'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      submissionIdIdx: index('comment_submission_id_idx').on(table.submissionId),
      userIdIdx: index('comment_user_id_idx').on(table.userId),
      createdAtIdx: index('comment_created_at_idx').on(table.createdAt),
    };
  },
);

export const todoSchema = pgTable('todo', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
