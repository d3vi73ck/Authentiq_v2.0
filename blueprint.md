# Stack

* **Next.js 15 (App Router)** + **Shadcn/UI**
* **Prisma + PostgreSQL**
* **NextAuth.js** (Credentials) + RBAC (association/chef/admin/superadmin)
* **MinIO** (S3-compatible) for files
* **OpenAI** for document text extraction and analysis

---

# Repo layout

```
kifndirou/
├─ .env
├─ docker-compose.yml
├─ prisma/
│  └─ schema.prisma
├─ expenseTypes.json
├─ src/
│  ├─ app/
│  │  ├─ (public)/
│  │  │  └─ page.tsx                  // marketing/landing (later)
│  │  ├─ (tenant)/
│  │  │  ├─ layout.tsx                // reads tenant from subdomain
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ new-expense/page.tsx
│  │  │  ├─ submissions/page.tsx
│  │  │  ├─ review/page.tsx
│  │  │  ├─ admin/reports/page.tsx
│  │  │  └─ settings/page.tsx
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ submissions/route.ts      // POST create, GET list (tenant)
│  │  │  ├─ submissions/[id]/route.ts // GET one, PATCH update
│  │  │  ├─ review/route.ts           // POST approve/reject
│  │  │  ├─ upload/route.ts           // POST file → MinIO + OCR + AI
│  │  │  └─ exports/route.ts          // GET CSV/PDF
│  │  └─ middleware.ts                // subdomain → tenant resolver
│  ├─ lib/
│  │  ├─ auth.ts
│  │  ├─ prisma.ts
│  │  ├─ rbac.ts
│  │  ├─ tenant.ts
│  │  └─ minio.ts
│  ├─ services/
│  │  ├─ ocr.ts
│  │  └─ ai.ts
│  ├─ components/
│  │  ├─ forms/ExpenseForm.tsx
│  │  ├─ uploads/FileDrop.tsx
│  │  └─ ui/* (shadcn)
│  └─ types/index.ts
└─ package.json
```

---

# Prisma schema (core)

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  subdomain String   @unique
  plan      String   @default("free")
  users     User[]
  submissions Submission[]
  createdAt DateTime @default(now())
}

model User {
  id        String  @id @default(cuid())
  email     String  @unique
  hash      String
  role      Role
  tenantId  String
  tenant    Tenant  @relation(fields: [tenantId], references: [id])
  createdAt DateTime @default(now())
}

enum Role {
  association
  chef
  admin
  superadmin
}

model Submission {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  type      String
  title     String?
  amount    Decimal?
  spentAt   DateTime?
  status    String   @default("draft") // draft|submitted|in_review|approved|rejected
  files     File[]
  comments  Comment[]
  createdBy String
  createdAt DateTime @default(now())
}

model File {
  id           String   @id @default(cuid())
  submissionId String
  submission   Submission @relation(fields: [submissionId], references: [id])
  kind         String    // "facture", "contrat", ...
  objectKey    String    // minio path
  size         Int
  mime         String
  ocrText      String?
  aiData       Json?
  createdAt    DateTime  @default(now())
}

model Comment {
  id           String   @id @default(cuid())
  submissionId String
  submission   Submission @relation(fields: [submissionId], references: [id])
  userId       String
  text         String
  decision     String?   // approve|reject|null
  createdAt    DateTime  @default(now())
}
```

---

# Tenant resolution (subdomain)

```ts
// src/lib/tenant.ts
export function getTenantFromHost(host?: string) {
  if (!host) return null;
  // e.g. myorg.kifndirou.com → "myorg"
  const [sub] = host.split(".");
  if (["www","admin","kifndirou"].includes(sub)) return null;
  return sub;
}
```

```ts
// src/app/middleware.ts
import { NextResponse } from "next/server";
import { getTenantFromHost } from "@/lib/tenant";
export function middleware(req: Request) {
  const url = new URL(req.url);
  const sub = getTenantFromHost(url.host);
  if (!sub && url.pathname.startsWith("/(tenant)")) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}
```

---

# MinIO client

```ts
// src/lib/minio.ts
import { Client } from "minio";
export const minio = new Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});
export const BUCKET = process.env.MINIO_BUCKET!;
```

---

# Upload API (save → OCR → AI)

```ts
// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { minio, BUCKET } from "@/lib/minio";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { runOCR } from "@/services/ocr";
import { parseDoc } from "@/services/ai";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({error:"unauth"}, {status:401});

  const form = await req.formData();
  const file = form.get("file") as File;
  const submissionId = String(form.get("submissionId"));
  const kind = String(form.get("kind") || "unknown");

  const arrayBuf = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuf);

  const key = `tenants/${session.user.tenantId}/submissions/${submissionId}/${Date.now()}_${file.name}`;
  await minio.putObject(BUCKET, key, buffer);

  const ocrText = await runOCR(buffer, file.type);
  const aiData  = await parseDoc(ocrText); // can be no-op if AI disabled

  const rec = await prisma.file.create({
    data: { submissionId, kind, objectKey: key, size: buffer.length, mime: file.type, ocrText, aiData }
  });

  return NextResponse.json({ file: rec });
}
```

---

# OCR service (Tesseract)

```ts
// src/services/ocr.ts
import Tesseract from "tesseract.js";
export async function runOCR(buf: Buffer, mime: string) {
  // For PDFs: pre-convert to image pages (later). MVP: images only.
  const { data } = await Tesseract.recognize(buf, "eng+fra");
  return data.text?.slice(0, 50000) || ""; // cap
}
```

---

# AI parsing (optional)

```ts
// src/services/ai.ts
export async function parseDoc(ocrText: string) {
  if (!process.env.OPENAI_API_KEY) return null;
  const sys = `Extract JSON: {type, amount, date, supplier, confidence}`;
  const prompt = `Text:\n${ocrText}\nReturn JSON only.`;

  // call your preferred LLM (OpenAI fetch) and JSON.parse
  // MVP: simple regex fallback
  const amount = Number((ocrText.match(/(\d+[.,]\d{2})\s?€/)||[])[1]?.replace(",", "."));
  const date = (ocrText.match(/\b\d{2}\/\d{2}\/\d{4}\b/)||[])[0];
  return { type: null, amount: isNaN(amount)?null:amount, date: date||null, supplier: null, confidence: 0.4 };
}
```

---

# Submissions API

```ts
// src/app/api/submissions/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function GET() { /* list by tenantId */ }
export async function POST(req: NextRequest) {
  const session = await getServerSession();
  const body = await req.json();
  const rec = await prisma.submission.create({
    data: { ...body, tenantId: session!.user.tenantId, createdBy: session!.user.id }
  });
  return NextResponse.json(rec);
}
```

---

# RBAC guards (example)

```ts
// src/lib/rbac.ts
export function canReview(role: string) {
  return role === "reviewer" || role === "admin" || role === "superadmin";
}
export function canSubmit(role: string) {
  return role === "association" || canReview(role);
}
```

---

# `expenseTypes.json` (driver for New Expense page)

```json
{
  "consultants": {
    "label": "Consultants / Prestataires",
    "required": ["bon_commande", "devis_1", "devis_2", "devis_3", "pv_reception", "tdr", "contrat", "facture", "retenue_source", "preuve_paiement"]
  },
  "salaires": {
    "label": "Salaires",
    "required": ["contrat_travail", "fiche_paie", "attestation_paiement"]
  }
}
```

---

# Docker compose (Postgres + MinIO + App)

```yaml
version: "3.9"
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: kifndirou
      POSTGRES_USER: kif
      POSTGRES_DB: kifndirou
    volumes: [ "pg:/var/lib/postgresql/data" ]
    ports: [ "5432:5432" ]

  minio:
    image: quay.io/minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: admin
      MINIO_ROOT_PASSWORD: strongpass123
    ports: [ "9000:9000", "9001:9001" ]
    volumes: [ "minio:/data" ]

  web:
    build: .
    env_file: .env
    depends_on: [ db, minio ]
    ports: [ "3000:3000" ]

volumes:
  pg:
  minio:
```

**.env (example)**

```
DATABASE_URL="postgresql://kif:kifndirou@db:5432/kifndirou"
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=strongpass123
MINIO_BUCKET=justificatifs
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

# MVP scope checklist

* Multi-tenant DB + subdomain resolver
* Auth (NextAuth Credentials) + RBAC
* New Expense page (driven by `expenseTypes.json`)
* Upload → MinIO + OCR (+ optional AI)
* Submissions list + detail
* Review actions (approve/reject + comments)
* Basic exports (CSV)