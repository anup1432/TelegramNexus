# TeleGroup Market - Telegram Group Selling Platform

## Project Overview

A professional full-stack web application for selling Telegram groups safely and profitably. The platform provides verification workflows, admin approval systems, earnings management, and withdrawal processing.

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + Shadcn UI
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (with in-memory storage fallback)
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

### Admin Features (Enhanced)
- **Comprehensive Admin Dashboard**: 5-tab interface for complete platform management
  - **Groups Tab**: Review submissions with ownership tracking, type badges, and detailed metadata
  - **Users Tab**: Full user management - view all users, edit balances, toggle admin roles, delete accounts
  - **Withdrawals Tab**: Process withdrawal requests with approval/rejection workflow
  - **Pricing Tab**: Dynamic price configuration - edit prices based on group age and member count
  - **Settings Tab**: Platform configuration including Telegram API credentials (API ID/Hash management)
- **Dynamic Pricing System**: Admin-editable price list with automatic fallback to default prices
- **User Data Tracking**: Complete user analytics with balance management and role assignment
- **Group Link Tracking**: Monitor all group submissions with ownership transfer detection
- **API Configuration**: Secure storage of Telegram API credentials and platform settings
- **Account Validation**: Comprehensive validation and security measures

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

### Admin Settings (New)
- id, settingKey, settingValue, description, updatedAt
- Used for storing Telegram API credentials and platform configuration

### Price Configuration (New)
- id, groupAge, memberRange, price, updatedAt
- Dynamic pricing table - admin-editable prices for different group categories

### Telegram Join Logs (Latest)
- id, groupLink, groupId, status (joining/joined/verified/message_sent/failed), errorMessage
- joinedAt, verifiedAt, messageSentAt, createdAt
- Activity tracking for automated Telegram group joins

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
**Groups Management:**
- `GET /api/admin/groups` - Get all groups
- `PATCH /api/admin/groups/:id` - Update group status

**Withdrawals Management:**
- `GET /api/admin/withdrawals` - Get all withdrawal requests
- `PATCH /api/admin/withdrawals/:id` - Update withdrawal status

**Users Management (New):**
- `GET /api/admin/users` - Get all users (without passwords)
- `PATCH /api/admin/users/:id` - Update user (admin status, balance)
- `DELETE /api/admin/users/:id` - Delete user account

**Price Configuration (New):**
- `GET /api/admin/prices` - Get all price configurations
- `PATCH /api/admin/prices/:id` - Update price for specific category

**Settings Management (New):**
- `GET /api/admin/settings` - Get all platform settings
- `POST /api/admin/settings` - Create or update a setting
- `PATCH /api/admin/settings/:key` - Update setting value
- `DELETE /api/admin/settings/:key` - Delete a setting

**Statistics:**
- `GET /api/admin/stats` - Get platform statistics

### Telegram Bot (Latest)
- `POST /api/telegram/config` - Configure Telegram API credentials (admin only)
- `GET /api/telegram/config` - Get current Telegram configuration (admin only)
- `POST /api/telegram/join/:groupId` - Auto-join group, verify, and send message (admin only)
- `GET /api/telegram/logs` - Get join activity logs (admin only)

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

## Recent Updates (October 2025)

### Enhanced Admin Panel
- ✅ Complete user management system with balance editing and role assignment
- ✅ Dynamic price configuration with admin-editable pricing table
- ✅ Platform settings management for API credentials (Telegram API ID/Hash)
- ✅ Enhanced group tracking with ownership monitoring
- ✅ PostgreSQL database integration with Drizzle ORM
- ✅ Comprehensive 5-tab admin dashboard interface

### Pricing System
- Dynamic pricing with fallback to static prices
- Admin can edit prices for any group age/member range combination
- Automatic price calculation based on configuration
- Safe fallback to default prices if config is missing

### Telegram Bot Integration (Latest)
- ✅ **Automated Group Management**: Bot automatically joins groups, verifies membership, and sends confirmation message "A"
- ✅ **Multi-Format Link Support**: 
  - Username links: `t.me/groupname`, `telegram.me/groupname`
  - Invite hash links: `t.me/+hash`, `t.me/joinchat/hash`
- ✅ **Comprehensive Error Handling**: Handles all common Telegram API errors with descriptive feedback
  - Invalid usernames/links, private channels, expired invites
  - Rate limiting (FLOOD_WAIT), join request pending
  - Channel limit reached, already a participant
- ✅ **Admin Configuration UI**: Dynamic Telegram API credentials management
  - API ID and API Hash configuration
  - Phone number authentication
  - Target username display for ownership transfers
- ✅ **Join Activity Logging**: Database tracking of all join attempts with timestamps and status
- ✅ **Dashboard Integration**: Shows target account username for ownership transfers
- ✅ **Auto-Join Button**: One-click group joining from submitted group cards
- ✅ **GramJS Integration**: Using Telegram MTProto user account automation (npm: telegram)

**Technical Implementation:**
- New `TelegramService` class with MTProto client management
- `telegramJoinLogs` database table for activity tracking
- API endpoints: `/api/telegram/config`, `/api/telegram/join/:groupId`
- Secure credential storage in admin settings
- React Query mutations for real-time UI feedback

## Future Enhancements

- Real-time WebSocket updates for join status
- Email notifications
- Payment gateway integration
- Enhanced analytics dashboard with charts
- File upload for screenshots
- Bulk operations for admin (approve multiple groups at once)
- Retry/backoff mechanism for FLOOD_WAIT responses
