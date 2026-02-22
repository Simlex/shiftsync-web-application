# Project Structure Guide

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**: Radix UI primitives
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: TanStack React Query
- **HTTP Client**: Axios
- **Animations**: Framer Motion
- **Date Handling**: date-fns, Moment.js
- **Authentication**: NextAuth.js (auth.ts file present)

## Root Level Structure

```
├── .env                      # Environment variables (not committed)
├── .git/                     # Git repository
├── .github/                  # GitHub workflows and templates
├── .gitignore               # Git ignore patterns
├── .next/                   # Next.js build output (generated)
├── Dockerfile               # Docker container configuration
├── README.md                # Project documentation
├── auth.ts                  # NextAuth.js authentication configuration
├── components.json          # UI components configuration (shadcn/ui)
├── docs/                    # Project documentation
├── next-env.d.ts           # Next.js TypeScript declarations
├── next.config.ts          # Next.js configuration
├── node_modules/           # NPM dependencies
├── package-lock.json       # Exact dependency versions
├── package.json            # Project dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration for Tailwind
├── public/                 # Static assets
├── src/                    # Source code (main application logic)
```

## Source Code Structure (`src/`)

Sample:

```
src/
├── animations/             # Animation definitions and configurations
│   ├── modal.ts           # Modal animation presets
│   └── navbarAnimations.ts # Navigation animations
├── app/                   # Next.js App Router directory
│   ├── globals.css        # Global CSS styles
│   ├── globals.scss       # Global SCSS styles
│   ├── layout.tsx         # Root layout component
│   ├── (pages)/          # Route groups for pages
│   ├── api/              # API route handlers
│   ├── auth/             # Authentication pages/routes
│   └── styles/           # Additional style files
├── client-hooks/          # Custom React hooks for client-side logic
│   ├── useDebounce.ts    # Debouncing utility hook
│   ├── useOnline.tsx     # Online/offline status detection
│   ├── useOuterClick.tsx # Click outside detection
│   └── useRemoveHtmlElementFromDOM.tsx # DOM manipulation hook
├── components/            # Reusable UI components
│   ├── Provider.tsx      # Global providers wrapper
│   ├── analytics-page/   # Analytics dashboard components
│   ├── authPages/        # Authentication-related components
│   ├── coupons-page/     # Coupon management components
│   ├── dialogs/          # Modal dialog components
│   ├── drawers/          # Drawer/sidebar components
│   ├── enquiries-page/   # Customer enquiry components
│   ├── homepage/         # Dashboard homepage components
│   ├── modal/            # Modal components
│   ├── newsletter-page/  # Newsletter management components
│   ├── notifications-page/ # Notification management
│   ├── organizer-reviews-page/ # Organizer review components
│   ├── payments-page/    # Payment management components
│   ├── payouts-page/     # Payout management components
│   ├── reusables/        # Common reusable components
│   ├── shared/           # Shared utility components
│   ├── ticket-orders-page/ # Ticket order management
│   ├── tickets-page/     # Ticket management components
│   ├── ui/               # Base UI components (buttons, inputs, etc.)
│   └── users-page/       # User management components
├── constants/            # Application-wide constants
├── contexts/             # React Context providers
├── enums/                # TypeScript enums
├── hooks/                # Custom React hooks (server-side compatible)
├── lib/                  # Utility libraries and configurations
├── models/               # TypeScript interfaces and types
├── providers/            # Global state providers
├── services/             # API services and external integrations
└── types/                # TypeScript type definitions
```

## Component Architecture (`src/components/`)

The components are organized by feature/page for better maintainability. Sample below:

```
components/
├── Provider.tsx              # Root providers (Query, Theme, Auth, etc.)
├── analytics-page/           # Analytics & reporting components
├── authPages/               # Login, signup, password reset
├── coupons-page/            # Coupon creation and management
├── dialogs/                 # Modal dialogs for various actions
├── drawers/                 # Slide-out panels and drawers
├── enquiries-page/          # Customer support and enquiry handling
├── homepage/                # Main dashboard overview
├── modal/                   # Generic modal components
├── newsletter-page/         # Email newsletter management
├── notifications-page/      # System notification management
├── organizer-reviews-page/  # Event organizer review system
├── payments-page/           # Payment processing and history
├── payouts-page/           # Payout management for organizers
├── reusables/              # Cross-feature reusable components
├── shared/                 # Common shared components
├── ticket-orders-page/     # Ticket order processing and management
├── tickets-page/           # Ticket creation and configuration
├── ui/                     # Base UI primitives (buttons, forms, etc.)
└── users-page/             # User account management
```

## App Router Structure (`src/app/`)

```
app/
├── globals.css             # Global styles
├── globals.scss           # Global SCSS styles
├── layout.tsx             # Root layout with providers
├── (pages)/               # Grouped routes for main pages
│   ├── analytics/         # Analytics dashboard routes
│   ├── coupons/          # Coupon management routes
│   ├── enquiries/        # Customer enquiry routes
│   ├── events/           # Event management routes
│   ├── newsletter/       # Newsletter management routes
│   ├── notifications/    # Notification management routes
│   ├── payments/         # Payment management routes
│   ├── payouts/          # Payout management routes
│   ├── reviews/          # Review management routes
│   ├── tickets/          # Ticket management routes
│   └── users/            # User management routes
├── api/                  # API route handlers
│   ├── auth/            # Authentication API endpoints
│   ├── analytics/       # Analytics data endpoints
│   ├── events/          # Event management APIs
│   └── users/           # User management APIs
├── auth/                # Authentication pages
│   ├── signin/          # Sign-in page
│   ├── signup/          # Sign-up page
│   └── callback/        # Auth callback handling
└── styles/              # Additional styling files
```

## Public Assets (`public/`)

```
public/
├── fonts/               # Custom font files
├── images/              # Static images and icons
│   ├── logos/          # Brand logos and variations
│   ├── icons/          # SVG icons and graphics
│   └── placeholders/   # Placeholder images
└── images.ts           # Image path constants and exports
```

## Documentation Structure (`docs/`)

Sample:

```
docs/
└── TableActionsMenu/
    └── TABLEACTIONSMENU_USAGE_EXAMPLE.md # Component usage examples
```

## Key Configuration Files

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev -p 9020",    # Custom port for admin console
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### Next.js Configuration (`next.config.ts`)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

## Development Workflow

### Setup Commands

```bash
# Install dependencies (supports both npm and pnpm)
npm install
# or
pnpm install

# Start development server (runs on port 9020)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Environment Variables

Create a `.env` file with the following structure:

```
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:9020"
API_BASE_URL="your_api_server_url"
```

## Architecture Features

### UI Component System

- **Radix UI Primitives**: Accessible, unstyled UI components
- **Custom UI Library**: Built on top of Radix with consistent design system
- **Component Composition**: Flexible, composable component architecture
- **Type Safety**: Full TypeScript support across all components

### State Management

- **TanStack React Query**: Server state management and caching
- **React Context**: Global application state
- **Local State**: Component-level state with React hooks

### Routing & Navigation

- **App Router**: Next.js 15 App Router for file-based routing
- **Route Groups**: Organized routes with `(pages)` grouping
- **Dynamic Routes**: Parameter-based routing for resource management
- **API Routes**: Server-side API endpoints within the same application

### Authentication & Security

- **NextAuth.js**: Complete authentication solution
- **Role-Based Access**: Admin-level permissions and access control
- **Session Management**: Secure session handling
- **Route Protection**: Protected routes for authenticated users

### Developer Experience

- **TypeScript**: Full type safety across the application. No use of "any" type
- **Custom Hooks**: Reusable logic extraction
- **Component Documentation**: Usage examples and guidelines
- **Consistent Structure**: Feature-based component organization

### Performance Features

- **Server Components**: React Server Components for optimal performance
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Built-in caching strategies

This provides a comprehensive interface for managing all aspects of the platform, with a focus on usability, performance, and maintainability.
