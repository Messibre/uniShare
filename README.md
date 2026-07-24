# uniShare - Campus Rental System

> A full‑stack web application for students to browse, list, and rent academic and everyday campus gear. Built with modern 2026 standards – authentication, payments, digital identity, and automated deployment.

## 🚀 Tech Stack

| Layer              | Technology                         |
| ------------------ | ---------------------------------- |
| **Framework**      | Next.js 15 (App Router) + React 19 |
| **Language**       | TypeScript                         |
| **Database**       | Supabase (PostgreSQL)              |
| **ORM**            | Prisma                             |
| **Authentication** | JWT (httpOnly cookies) + bcrypt    |
| **Payments**       | Chapa (Ethiopian gateway)          |
| **Identity**       | Fayda eSignet (OIDC / Sandbox)     |
| **Styling**        | Tailwind CSS + shadcn/ui           |
| **Testing**        | Vitest + React Testing Library     |
| **CI/CD**          | GitHub Actions → Vercel            |

## 📁 Project Structure (planned)

uniShare/
├── app/
│ ├── api/ # Next.js Route Handlers
│ ├── dashboard/ # Protected user dashboard
│ └── (auth)/ # Login / Register pages
├── lib/
│ ├── prisma.ts # DB client
│ ├── auth.ts # JWT utilities
│ └── chapa.ts # Payment gateway
├── prisma/
│ └── schema.prisma # Database models
├── public/
├── tests/
├── .github/workflows/ # CI/CD pipelines
└── ...

text

## 🔧 Local Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/uniShare.git
   cd uniShare
   Install dependencies:
   ```

bash
npm install
Copy environment variables:

bash
cp .env.example .env.local
(We'll create .env.example in Phase 1)

Set up the database (Supabase):

bash
npx prisma migrate dev
npx prisma db seed
Run the development server:

bash
npm run dev
🌐 Environment Variables
Variable Description
DATABASE_URL Supabase PostgreSQL connection string
JWT_ACCESS_SECRET Secret for access tokens (15min)
JWT_REFRESH_SECRET Secret for refresh tokens (7 days)
CHAPA_SECRET_KEY Chapa payment gateway key
FAYDA_CLIENT_ID Fayda OIDC client ID (sandbox)
APP_URL http://localhost:3000 (dev)
📝 Commit Convention
We use Conventional Commits:

feat: – new feature

fix: – bug fix

chore: – maintenance tasks

docs: – documentation updates

test: – adding tests

📄 License
MIT
