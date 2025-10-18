# TeleGroup Market - Telegram Group Selling Platform

## Project Overview

A professional full-stack web application for selling Telegram groups safely and profitably. The platform provides verification workflows, admin approval systems, earnings management, and withdrawal processing.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Node.js + Express
- **Storage**: In-memory storage (MemStorage) with plans for PostgreSQL
- **Authentication**: JWT tokens with bcrypt password hashing
- **State Management**: TanStack React Query
- **Routing**: Wouter
- **Theme**: Dark/Light mode toggle (default: dark)

## Project Structure

```
├── client/                    # Frontend React application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # Shadcn UI components
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── group-card.tsx
│   │   │   ├── price-table.tsx
│   │   │   ├── stats-card.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── status-timeline.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── pages/            # Application pages
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── sell-group.tsx
│   │   │   ├── earnings.tsx
│   │   │   ├── support.tsx
│   │   │   └── admin.tsx
│   │   ├── lib/
│   │   │   ├── auth-context.tsx  # Authentication context
│   │   │   └── queryClient.ts    # React Query client with JWT
│   │   ├── App.tsx           # Main app with routing
│   │   └── index.css         # Global styles & theme tokens
│   └── index.html
├── server/                    # Backend Express application
│   ├── routes.ts             # API routes & endpoints
│   ├── storage.ts            # Data storage interface
│   └── index.ts              # Server entry point
├── shared/
│   └── schema.ts             # Shared TypeScript types & Zod schemas
└── design_guidelines.md      # UI/UX design system

## Key Features

### User Features
- **Authentication**: Register/login with username and password
- **Dashboard**: View stats, recent groups, quick actions
- **Sell Groups**: Submit single groups or folders with verification workflow
- **Status Tracking**: Monitor group status through 5-stage pipeline (Submitted → Verified → Ownership → Review → Paid)
- **Earnings**: View balance, earnings history, request withdrawals
- **Support**: Access help resources and FAQs

### Admin Features
- **Admin Panel**: Manage all groups and withdrawal requests
- **Approval System**: Approve/reject groups with reason notes
- **Withdrawal Processing**: Approve/reject withdrawal requests
- **Statistics Dashboard**: Track platform metrics (users, groups, earnings, pending reviews)

## Data Models

### Users
- id, username, password (bcrypt hashed), telegramId, balance, isAdmin, createdAt

### Groups
- id, ownerId, type (single/folder), link, description, members, groupAge, screenshotUrl
- status (submitted/verified/ownership/review/paid/rejected), price, rejectionReason
- submittedAt, verifiedAt, paidAt

### Withdrawals
- id, userId, amount, method (upi/crypto/bank/paypal), details
- status (pending/approved/rejected), rejectionReason
- requestedAt, processedAt

### Transactions
- id, userId, groupId, withdrawalId, type (earning/withdrawal), amount, status, createdAt

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login and receive JWT token
- `POST /api/auth/logout` - Logout (client-side token removal)
- `GET /api/auth/me` - Get current authenticated user

### Groups
- `POST /api/groups` - Submit new group for verification
- `GET /api/groups` - Get user's groups
- `GET /api/groups/stats` - Get user's group statistics

### Withdrawals
- `POST /api/withdrawals` - Request withdrawal
- `GET /api/withdrawals` - Get user's withdrawal requests
- `GET /api/withdrawals/stats` - Get withdrawal statistics

### Admin (requires admin role)
- `GET /api/admin/groups` - Get all groups
- `PATCH /api/admin/groups/:id` - Update group status
- `GET /api/admin/withdrawals` - Get all withdrawal requests
- `PATCH /api/admin/withdrawals/:id` - Update withdrawal status
- `GET /api/admin/stats` - Get platform statistics

## Authentication Flow

1. User registers or logs in
2. Server validates credentials and returns JWT token
3. Token stored in localStorage
4. All subsequent API requests include `Authorization: Bearer <token>` header
5. Server validates token on protected routes
6. On logout, token is removed from localStorage

## Design System

- **Primary Color**: Telegram Blue (200 95% 55%)
- **Success**: Green (142 76% 45%)
- **Warning/Pending**: Amber (38 92% 55%)
- **Error/Rejected**: Red (0 84% 58%)
- **Typography**: Inter (UI), JetBrains Mono (data/code)
- **Components**: Shadcn UI with custom styling
- **Theme**: Dark mode by default with light mode toggle

## Default Admin Account

- **Username**: admin
- **Password**: admin123

## Development

The application runs on a single port with Vite dev server for frontend and Express for backend.

```bash
npm run dev
```

## Future Enhancements

- PostgreSQL database integration
- Telegram Bot API for automated verification
- Real-time WebSocket updates
- Email notifications
- Payment gateway integration
- Enhanced analytics dashboard
- File upload for screenshots
