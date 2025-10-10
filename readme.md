Perfect — here’s your **complete, clear project definition** for your SaaS 👇

---

## 🧾 Project: **Kif Ndirou – SaaS Justificatif System for NGOs**

### 🎯 **Objective**

Build a **SaaS platform** that helps **ONGs and associations** securely manage, validate, and centralize all their **expense justification documents** (factures, contrats, PVs…).
Each organization has its **own workspace (tenant)** with dedicated users and data, while you (the superadmin) manage the whole platform.

The system automates:

* Uploading and validating justificatifs
* Role-based approvals
* OCR/AI-based document checking
* Centralized storage and reporting

---

## 🧱 **Architecture Overview**

### 🔹 Type

Multi-tenant SaaS (1 shared codebase, multiple ONG spaces)

### 🔹 Deployment

Runs on your VPS (Dockerized)

* Nginx reverse proxy for subdomains
* MinIO for file storage
* PostgreSQL for tenant-aware data
* Cloudflare for SSL/subdomain routing

---

## 🧩 **Tech Stack**

| Layer               | Tool                         | Purpose                               |
| ------------------- | ---------------------------- | ------------------------------------- |
| **Frontend + API**  | Next.js 15 (App Router)      | Unified full-stack framework          |
| **UI**              | Shadcn/UI + TailwindCSS      | Clean, modern design                  |
| **Database**        | PostgreSQL (via Prisma ORM)  | Multi-tenant schema                   |
| **Storage**         | MinIO (self-hosted S3)       | Centralized secure document storage   |
| **Auth**            | NextAuth.js                  | Roles + tenant-based session handling |
| **AI Processing**   | OpenAI API (or local Ollama) | Extracts text and analyzes documents  |
| **Billing (later)** | Stripe                       | ONG subscriptions & quotas            |
| **Infra**           | Docker + Nginx + Cloudflare  | Self-hosted SaaS foundation           |

---

## 🏢 **Multi-Tenant Model**

| Entity       | Description                                                            |
| ------------ | ---------------------------------------------------------------------- |
| `Tenant`     | Represents each ONG (name, domain, plan, settings)                     |
| `User`       | Belongs to a tenant; has role: association, chef, admin, or superadmin |
| `Submission` | One expense submission; linked to tenant                               |
| `File`       | Uploaded justificatif (stored in MinIO with OCR + AI metadata)         |
| `Comment`    | Review notes between chef/admin and association                        |

Each query filters by `tenantId`.
Each ONG accesses the app via its own subdomain:
**`ongname.kifndirou.com`**

---

## 💻 **Pages / Modules**

### 1. **Public Landing Page (Main domain)**

* Overview of the SaaS
* “Create your ONG account” form
* Pricing & onboarding (later via Stripe)

---

### 2. **Tenant Dashboard (`{ong}.kifndirou.com`)**

#### 🔸 Login / Signup

* ONG users authenticate with email/password
* Roles:

  * `association`: can submit justificatifs
  * `chef`: reviews and validates
  * `admin`: global ONG view
  * `superadmin`: platform owner

---

#### 🔸 New Expense Page

* Select expense type (Salaires, Consultants, etc.)
* Dynamic checklist of required documents
* Upload files
* OCR & AI auto-fill (amount, date, doc type)
* Save draft or submit for validation

---

#### 🔸 My Submissions

* List of all submissions (with status)
* Filters: status, date, type
* Click to view submission details

---

#### 🔸 Review Panel (for Chef/Admin)

* Inbox of pending submissions
* View uploaded docs
* Approve / Reject with comments
* Mark inconsistent or missing documents

---

#### 🔸 Admin Reports

* Overview of ONG expenses
* Filters by period / type / status
* Export PDF or CSV
* Dashboard summary (total justified, rejected, pending)

---

#### 🔸 Settings (optional for later)

* Manage ONG users
* Update ONG name, logo, permissions
* Storage usage & quota

---

### 3. **Superadmin Panel (`admin.kifndirou.com`)**

* List all tenants (ONGs)
* Usage stats, storage, activity
* Create / suspend tenants
* Monitor overall system health

---

## 🚀 **MVP Focus (Phase 1)**

### 🎯 Core goal

A single ONG can:

* Upload justificatifs per expense type
* Validate via Chef/Admin
* Run OCR + AI checks
* View/export reports

### 🔹 MVP Features

* Multi-role auth (association / chef / admin)
* File uploads (MinIO)
* OCR text extraction
* AI auto-fill (optional)
* Submissions with dynamic required docs
* Simple review workflow
* PostgreSQL + Prisma setup
* Basic dashboard for ONG admin

---

## 🔄 **Later Phases**

| Phase   | Features                                             |
| ------- | ---------------------------------------------------- |
| Phase 2 | Multi-tenant subdomains + Superadmin dashboard       |
| Phase 3 | Stripe billing per ONG (plans, quotas)               |
| Phase 4 | Real-time notifications, email reminders             |
| Phase 5 | Advanced AI validation + automatic rejection reasons |
| Phase 6 | Analytics dashboards per ONG                         |

---

## 🧩 **Example flow**

1. ONG logs in at `myorg.kifndirou.com`
2. Association user → clicks “New Expense”
3. Uploads required docs (AI fills amount/date)
4. Submits → status = “in review”
5. Chef → reviews & approves/rejects
6. ONG Admin → sees reports and exports data
7. Superadmin → monitors all ONG activity globally

---

## 🧠 **Why this is powerful**

* Each ONG gets its own secure space
* No document loss / manual folder mess
* Auto-checks & AI speed up validation
* Fully open-source + self-hosted = low cost
* You own the entire system & data

---
