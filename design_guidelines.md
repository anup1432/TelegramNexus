# Design Guidelines: Telegram Group Marketplace Platform

## Design Approach

**Selected Approach:** Design System with Modern SaaS Dashboard Patterns

**Justification:** This is a utility-focused platform requiring clarity, efficiency, and trust. Drawing inspiration from Stripe Dashboard (data clarity), Linear (modern minimalism), and Binance/crypto platforms (transaction management), we'll create a professional trading interface that balances functionality with modern aesthetics.

**Core Principles:**
- Trust & Transparency: Clear status indicators and progress tracking
- Efficiency: Quick access to key actions and information
- Data Clarity: Well-organized tables, cards, and metrics
- Professional Authority: Clean, sophisticated visual language

---

## Color Palette

### Dark Mode (Primary Theme)
- **Background Base:** 220 15% 8% (deep slate, almost black)
- **Surface:** 220 15% 12% (elevated cards/panels)
- **Surface Elevated:** 220 12% 16% (modals, dropdowns)
- **Border:** 220 10% 22% (subtle borders)
- **Text Primary:** 220 10% 95% (high contrast white)
- **Text Secondary:** 220 5% 65% (muted text)
- **Text Tertiary:** 220 5% 45% (labels, captions)

### Light Mode
- **Background Base:** 220 20% 97% (soft white)
- **Surface:** 0 0% 100% (pure white cards)
- **Surface Elevated:** 220 15% 98% (modals)
- **Border:** 220 12% 88% (borders)
- **Text Primary:** 220 15% 12% (near black)
- **Text Secondary:** 220 8% 35% (muted)
- **Text Tertiary:** 220 8% 55% (labels)

### Brand & Accent Colors
- **Primary (Telegram Blue):** 200 95% 55% (vibrant telegram blue for CTAs, links)
- **Primary Hover:** 200 95% 50% (slightly darker)
- **Success:** 142 76% 45% (verification, approved states)
- **Warning:** 38 92% 55% (pending, review states)
- **Error:** 0 84% 58% (rejected, failed states)
- **Info:** 220 90% 60% (informational badges)

### Status Colors
- **Submitted:** 220 15% 40% (neutral gray)
- **Verified:** 200 95% 55% (telegram blue)
- **Ownership Transfer:** 38 92% 55% (amber)
- **Review:** 38 92% 55% (amber)
- **Paid/Complete:** 142 76% 45% (green)
- **Rejected:** 0 84% 58% (red)

---

## Typography

### Font Families
- **Primary (UI):** Inter (Google Fonts) - Clean, professional, optimized for UI
- **Monospace (Data):** JetBrains Mono (Google Fonts) - For transaction IDs, group links, codes

### Type Scale
- **Display:** 2.5rem (40px), font-weight: 700, line-height: 1.2 (landing page hero)
- **H1:** 2rem (32px), font-weight: 700, line-height: 1.3 (page titles)
- **H2:** 1.5rem (24px), font-weight: 600, line-height: 1.4 (section headers)
- **H3:** 1.25rem (20px), font-weight: 600, line-height: 1.4 (card titles)
- **Body Large:** 1rem (16px), font-weight: 400, line-height: 1.6 (primary content)
- **Body:** 0.875rem (14px), font-weight: 400, line-height: 1.6 (default text)
- **Small:** 0.75rem (12px), font-weight: 400, line-height: 1.5 (labels, captions)
- **Tiny:** 0.6875rem (11px), font-weight: 500, line-height: 1.4 (badges, timestamps)

---

## Layout System

### Spacing Units
**Core Spacing Set:** Use Tailwind units of **4, 6, 8, 12, 16, 24** for consistency
- Micro spacing (gaps, padding): 4 (1rem / 16px)
- Component padding: 6 (1.5rem / 24px)
- Section spacing: 8 (2rem / 32px), 12 (3rem / 48px)
- Large gaps: 16 (4rem / 64px), 24 (6rem / 96px)

### Grid & Container
- **Max Container Width:** max-w-7xl (1280px) for main content
- **Dashboard Columns:** Sidebar (256px fixed) + Main (flex-1)
- **Card Grids:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- **Table Layout:** Full-width with horizontal scroll on mobile

### Responsive Breakpoints
- Mobile: base (< 768px)
- Tablet: md (768px+)
- Desktop: lg (1024px+)
- Wide: xl (1280px+)

---

## Component Library

### Navigation & Layout

**Top Navigation Bar**
- Fixed height: h-16 (64px)
- Dark surface with border-b
- Contains: Logo (left), Main nav links (center), Theme toggle + User menu (right)
- User menu shows avatar, username, balance badge

**Sidebar (Dashboard)**
- Fixed width: w-64 (256px) on desktop, slide-out drawer on mobile
- Navigation items with icons (from Heroicons)
- Active state: Blue accent border-left + blue text
- Sections: Dashboard, Sell Group, Earnings, Support, Admin (if admin)

**Footer**
- Simple, minimal footer with links and copyright
- Links: Terms, Privacy, Support, Status
- Social icons in monochrome

### Cards & Containers

**Primary Card**
- Background: surface color
- Border: 1px solid border color
- Border radius: rounded-lg (8px)
- Padding: p-6 (24px)
- Shadow: shadow-sm on light mode, subtle glow on dark mode

**Stat Card (Dashboard)**
- Compact height: p-4
- Icon + Label + Large number + Optional trend indicator
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4

**Group Listing Card**
- Image/icon at top (if screenshot available)
- Group name, member count, creation date
- Status badge (colored)
- Price display (prominent)
- Action buttons at bottom

### Forms & Inputs

**Text Input**
- Height: h-10 (40px)
- Padding: px-4
- Border: 1px solid border, focus:border-primary focus:ring-2 focus:ring-primary/20
- Background matches theme (dark in dark mode, white in light)
- Rounded: rounded-md (6px)

**Select Dropdown**
- Same styling as text input
- Chevron down icon (Heroicon)
- Dark dropdown menu in dark mode

**File Upload**
- Dashed border dropzone
- "Click to upload or drag and drop" text
- Preview thumbnail for uploaded images
- Remove button (X icon)

**Button Styles**
- **Primary:** bg-primary text-white, px-6 py-2.5, rounded-md, hover:bg-primary-hover
- **Secondary:** bg-surface border border-border, hover:bg-surface-elevated
- **Outline:** border-2 border-primary text-primary, hover:bg-primary/10
- **Ghost:** text-primary hover:bg-primary/10
- **Danger:** bg-error text-white
- Height: h-10 for normal, h-8 for small

### Data Display

**Price List Table**
- Striped rows for readability
- Header: sticky top-0, darker background
- Columns: Group Age | Member Range | Price (USD)
- Responsive: Stack on mobile with labels
- Borders between rows: border-b

**Status Timeline/Progress**
- Horizontal stepper on desktop, vertical on mobile
- Steps: Submitted → Verified → Ownership → Review → Paid
- Active step: Blue fill, larger icon
- Completed: Green checkmark
- Pending: Gray outline
- Failed: Red X

**Transaction/Group Table (Admin)**
- Full-width scrollable container
- Sticky header row
- Columns: User | Group Link | Members | Status | Price | Actions
- Action buttons: small icons (check, X, eye)
- Filterable and sortable headers
- Pagination at bottom

### Badges & Status Indicators

**Status Badge**
- Small rounded-full pill
- Padding: px-2.5 py-1
- Text: text-xs font-medium uppercase tracking-wide
- Colors match status (verified = blue, pending = amber, etc.)

**Balance Badge**
- Displayed in header
- Shows: "$123.45" with wallet icon
- Subtle background: bg-success/10 text-success

### Modals & Overlays

**Modal Container**
- Centered overlay with backdrop blur
- Max-width: max-w-2xl
- Padding: p-6 to p-8
- Close button (X) top-right
- Header + Content + Footer sections

**Notification Toast**
- Slide in from top-right
- Success: Green border-left accent
- Error: Red border-left accent
- Auto-dismiss after 5 seconds
- Close button

### Icons
**Icon Library:** Heroicons (via CDN)
- Navigation: HomeIcon, CurrencyDollarIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon
- Actions: CheckCircleIcon, XCircleIcon, EyeIcon, PencilIcon
- Status: ClockIcon, CheckBadgeIcon, ExclamationTriangleIcon
- Size: w-5 h-5 for inline, w-6 h-6 for buttons

---

## Animations

**Use Sparingly - Only Where Necessary:**
- Page transitions: Simple fade-in (opacity 0 to 1, 200ms)
- Status changes: Subtle scale pulse when status updates
- Button hover: Scale 1.02 with smooth transition
- Dropdown menus: Slide down with fade (150ms)
- Loading states: Simple spinner (no elaborate animations)

**No Animations For:**
- Scrolling effects
- Parallax
- Complex page entry effects
- Decorative motion

---

## Images

### Hero Section (Landing/Marketing)
**Large Hero Image:** Yes - Full-width hero with gradient overlay
- Image description: Modern, professional workspace with laptop showing dashboard interface. Telegram logo subtly visible. Clean, bright, aspirational.
- Placement: Top of landing page, height: h-[500px] md:h-[600px]
- Overlay: Dark gradient from bottom (rgba(0,0,0,0.6) to transparent)
- Content on top: Centered headline + CTA button

### Dashboard/App Screenshots
- Image description: Clean dashboard mockup showing group cards and stats
- Placement: Features section of landing page, within laptop/browser frame mockup
- Style: Floating card with subtle shadow

### No Images Needed For:
- Dashboard (use icons and data visualization instead)
- Admin panel (focus on functionality)
- User profile sections

---

## Page-Specific Layouts

### Landing Page
- Hero with large image, headline "Sell Your Telegram Groups Safely & Profitably", CTA button
- Features section: 3-column grid showcasing verification, admin approval, instant payouts
- How It Works: Vertical timeline/stepper visualization
- Pricing table: Full price list in organized table
- CTA section: Join now with prominent signup button
- Footer with links

### Dashboard
- Sidebar navigation + Top bar
- Stats overview: 4-card grid (Total Earnings, Pending Groups, Completed, Available Balance)
- Recent groups: Table or card list
- Quick actions: Large buttons for "Sell Your Group", "Request Withdrawal"

### Sell Your Group Page
- Two-column form layout (desktop)
- Left: Form fields (group type selector, link input, description, members, screenshot upload)
- Right: Preview card + Price calculator showing estimated earnings
- Submit button at bottom

### Admin Panel
- Full-width data table
- Filters at top (status, date range, search)
- Bulk actions checkbox column
- Action buttons per row
- Statistics dashboard above table

This comprehensive design system provides a professional, trustworthy, and efficient interface for the Telegram Group marketplace platform.