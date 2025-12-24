# StitchCraft Ghana 🇬🇭

A premium digital platform for Ghanaian tailors and their clients. StitchCraft streamlines garment ordering, measurement management, and workshop operations with modern, mobile-first interfaces optimized for the local market.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### For Tailors (Artisans)
- **Order Management** - Track orders from pending to delivery with status workflows
- **Client Database** - Manage client profiles, measurements, and order history
- **Workshop Queue** - Kanban-style task management for production workflow
- **Inventory Tracking** - Monitor fabrics, threads, and equipment with stock movements
- **Payment Processing** - Integrated Paystack payments with mobile money support
- **Digital Invoices** - QR-verified invoices with Ghana tax compliance (VAT/NHIL/GETFund)
- **Team Management** - Invite workers with role-based permissions
- **Analytics Dashboard** - Track revenue, orders, and business performance

### For Clients
- **Style Studio** - Personal portal to view orders, measurements, and saved designs
- **Order Tracking** - Real-time status updates via public tracking links
- **Measurement Sync** - Bidirectional sync with tailor workshops
- **Digital Wardrobe** - Save and curate favorite styles from the gallery

### Public Features
- **Artisan Discovery** - Browse and find tailors by region and specialty
- **Style Gallery** - Explore portfolio items from master tailors
- **Public Showcase** - Each tailor gets a public portfolio page

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | PostgreSQL (Neon) + Prisma 7 |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI + shadcn/ui |
| Authentication | Custom session-based auth |
| Payments | Paystack |
| Email | Resend |
| SMS | Hubtel / Termii / Hub2SMS |
| Storage | Cloudflare R2 |
| Charts | ECharts |
| Testing | Vitest + Playwright |

## 📦 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database (or [Neon](https://neon.tech) account)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/stitch-craft.git
cd stitch-craft

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (optional)
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `RESEND_API_KEY` | ✅ | Resend API key for emails |
| `FROM_EMAIL` | ✅ | Sender email address |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public app URL |
| `PAYSTACK_SECRET_KEY` | ⚪ | Paystack secret key |
| `HUBTEL_CLIENT_ID` | ⚪ | Hubtel SMS credentials |
| `HUBTEL_CLIENT_SECRET` | ⚪ | Hubtel SMS credentials |
| `R2_ACCOUNT_ID` | ⚪ | Cloudflare R2 account |
| `R2_ACCESS_KEY_ID` | ⚪ | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | ⚪ | Cloudflare R2 secret |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Platform admin dashboard
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Tailor workshop dashboard
│   ├── discover/          # Public artisan discovery
│   ├── gallery/           # Public style gallery
│   ├── showcase/          # Public tailor portfolios
│   ├── studio/            # Client private portal
│   └── track/             # Public order tracking
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui components
│   └── ...               # Feature components
├── lib/                   # Utilities and services
│   ├── api-security.ts   # Unified API security
│   ├── direct-auth.ts    # Authentication helpers
│   ├── email-service.ts  # Email templates
│   ├── payment-service.ts # Payment processing
│   └── ...
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions

prisma/
└── schema.prisma          # Database schema

scripts/
├── seed.ts               # Database seeding
└── ...
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npx playwright test --ui
```

## 🏗️ Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run Biome linter |
| `npm run typecheck` | Run TypeScript checks |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed database |

## 🚢 Deployment

The application is deployed on [Vercel](https://vercel.com):

```bash
# Deploy to production
npx vercel --prod
```

**Live URL**: [https://www.stitchcraft.live](https://www.stitchcraft.live)

### Deployment Checklist
- [ ] Set all required environment variables in Vercel
- [ ] Ensure database is accessible from Vercel's network
- [ ] Enable Sentry integration for error monitoring
- [ ] Configure custom domain and SSL

## 🔒 Security

- CSRF protection on all mutating endpoints
- Rate limiting with tiered configurations
- Input sanitization and XSS prevention
- Security headers (HSTS, X-Frame-Options, etc.)
- HttpOnly, Secure session cookies
- Bcrypt password hashing (12 rounds)

## 📄 License

Proprietary - All rights reserved.

## 🤝 Support

For support, email [support@silentech.live](mailto:support@silentech.live) or reach out via WhatsApp at +233 20 922 5268.
