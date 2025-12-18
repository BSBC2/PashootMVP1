# Pashoot Reports

**Simple Financial Reports for Small Business**

Pashoot Reports is an AI-powered financial reporting SaaS that connects to multiple data sources (Wave, Stripe, Xero, Square, Airtable, Notion) and generates 25+ professional financial reports automatically.

## Features

- **25+ Professional Reports**: Income statements, cash flow, tax reports, and more
- **AI-Powered Chat**: Ask questions about your finances in plain English
- **6 Data Source Integrations**: Wave, Stripe, Xero, Square, Airtable, Notion
- **Tax-Ready Reports**: 1099 tracking, expense categorization, sales tax reports
- **PDF Export**: All reports can be exported as PDFs
- **Email Delivery**: Send reports directly to your accountant
- **Automated Sync**: Daily automatic data synchronization
- **Secure**: Bank-level encryption, OAuth authentication

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe (Checkout + Billing Portal)
- **Styling**: Tailwind CSS + shadcn/ui
- **AI**: Anthropic Claude API (Sonnet 4)
- **Email**: Resend
- **Deployment**: Render

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account
- Anthropic API key
- OAuth credentials for each data source

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pashoot-reports.git
cd pashoot-reports
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and fill in all required credentials.

4. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Your app URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PRICE_ID`: Stripe price ID for subscription
- `ANTHROPIC_API_KEY`: Anthropic API key for AI chat
- OAuth credentials for each integration

## Database Schema

The app uses Prisma with the following main models:

- **User**: User accounts with email/password authentication
- **Subscription**: Stripe subscription management
- **Connection**: OAuth connections to data sources
- **Transaction**: Synced financial transactions
- **Report**: Generated reports with PDFs
- **ChatMessage**: AI chat history

## Data Integrations

### Supported Sources

1. **Wave Accounting** - Transactions, invoices, customers, vendors
2. **Stripe** - Payments, refunds, customers, fees
3. **Xero** - Bank transactions, invoices, bills, contacts
4. **Square** - Payments, orders, customers
5. **Airtable** - Custom bases with financial data
6. **Notion** - Database records for expense tracking

### OAuth Flow

Each integration uses OAuth 2.0 for secure authentication:

1. User clicks "Connect [Source]"
2. Redirected to provider's authorization page
3. User grants permissions
4. App receives OAuth tokens (encrypted and stored)
5. Initial data sync triggered
6. Daily automatic syncs thereafter

## Reports Available

### Financial Statements (4)
- Income Statement (P&L)
- Balance Sheet
- Cash Flow Statement
- Trial Balance

### Revenue & Sales (3)
- Revenue Breakdown
- Sales by Customer
- Revenue Trends

### Expenses (3)
- Expense by Category
- Expense by Vendor
- Travel & Entertainment

### AR & AP (4)
- AR Aging Report
- AP Aging Report
- Customer Statement
- Vendor Statement

### Tax & Compliance (4)
- 1099 Contractor Report
- Sales Tax Report
- Tax Deduction Categorization
- Depreciation Schedule

### Management Reports (4)
- Budget vs Actual
- Profit Margin Analysis
- Break-Even Analysis
- Bank Reconciliation

### Reconciliation (3)
- Stripe Reconciliation
- Square Reconciliation
- Cross-Source Summary

## API Routes

### Authentication
- `POST /api/auth/signup` - Create new user + Stripe checkout
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Billing
- `POST /api/billing/portal` - Generate Stripe billing portal URL

### Webhooks
- `POST /api/webhooks/stripe` - Handle Stripe webhook events

### Connections (To be implemented)
- `GET /api/connect/[source]` - Initiate OAuth flow
- `POST /api/sync/[source]` - Trigger manual sync

### Reports (To be implemented)
- `POST /api/reports/generate` - Generate a report
- `GET /api/reports/[id]` - Get report details

### Chat (To be implemented)
- `POST /api/chat` - Send AI chat message

## Deployment

### Render

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Use `render.yaml` for configuration
5. Set environment variables in Render dashboard
6. Deploy!

The `render.yaml` file includes:
- Web service configuration
- PostgreSQL database
- Build and start commands
- Environment variable placeholders

### Environment Setup on Render

After deploying, set these environment variables in Render dashboard:
- All OAuth credentials
- Stripe keys
- Anthropic API key
- NEXTAUTH_URL (your Render URL)

## Development Roadmap

### Phase 1: MVP (Current)
- ✅ Authentication & Billing
- ✅ Dashboard UI
- ✅ Landing & Pricing pages
- ⏳ Data integrations (Wave, Stripe)
- ⏳ 5 core reports
- ⏳ AI chat

### Phase 2: Core Features
- Remaining integrations (Xero, Square, Airtable, Notion)
- All 25 reports
- PDF generation
- Email delivery

### Phase 3: Enhancements
- Report scheduling
- Custom report builder
- Multi-user accounts
- White-label options

## Security

- Passwords hashed with bcrypt
- OAuth tokens encrypted at rest
- All API routes authenticated
- SQL injection prevention (Prisma)
- XSS prevention (React)
- CSRF protection (NextAuth)
- HTTPS only in production

## Support

For issues and feature requests, please open an issue on GitHub.

## License

Proprietary - All rights reserved

---

**Built with ❤️ for small business owners**
