# ShiftSync Frontend Requirements & Implementation Guide

## Overview

ShiftSync is a comprehensive multi-location staff scheduling platform with intelligent constraint management, real-time updates, and robust swap/drop request workflows. This document outlines the complete frontend implementation requirements for a Next.js application.

## System Architecture

### Backend Integration

- **API Base URL**: `http://localhost:3001` (NestJS server)
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **Real-time**: Socket.io connection for live updates
- **Data Format**: All times stored as UTC, converted to location/user timezone for display

### Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand or React Query
- **Real-time**: Socket.io-client
- **Forms**: React Hook Form + Zod validation
- **Date/Time**: Luxon (timezone-aware)
- **Charts**: Recharts or Chart.js

## Core Features & User Flows

### 1. Authentication System

#### Login/Register Pages

- Email/password authentication
- Role-based redirects after login:
  - `ADMIN` → Admin Dashboard
  - `MANAGER` → Manager Dashboard
  - `STAFF` → Staff Dashboard
- JWT token management with automatic refresh

#### User Profile Management

- Edit personal details (name, email, preferred timezone)
- Update skills array (dropdown/checkbox selection)
- Set desired weekly hours
- Password change functionality

### 2. Staff User Interface

#### Dashboard (`/dashboard/staff`)

```typescript
// Key components to build:
interface StaffDashboard {
  upcomingShifts: ShiftAssignment[];
  weeklyHoursProgress: number;
  pendingRequests: {
    swaps: SwapRequest[];
    drops: DropRequest[];
  };
  notifications: Notification[];
  quickActions: {
    requestTimeOff: () => void;
    viewSchedule: () => void;
    manageAvailability: () => void;
  };
}
```

#### Schedule View (`/schedule`)

- **Calendar Interface**: Weekly/monthly view showing assigned shifts
- **Shift Details**: Click to view shift info, location, required skills
- **Color Coding**: Different theme & colors for different locations/shift types
- **Time Display**: Show times in user's preferred timezone
- **Quick Actions**: Clock in/out buttons for current shifts

#### Availability Management (`/availability`)

```typescript
interface AvailabilityManager {
  recurringAvailability: {
    dayOfWeek: number; // 0=Sun, 6=Sat
    startTime: string; // "09:00"
    endTime: string; // "17:00"
  }[];
  exceptions: {
    date: string; // "2026-03-15"
    unavailable?: boolean;
    customHours?: {
      startTime: string;
      endTime: string;
    };
  }[];
}
```

- **Weekly Template**: Set recurring availability for each day
- **Exception Management**: Add one-off unavailable dates or custom hours
- **Timezone Handling**: All times in user's preferred timezone
- **Validation**: Prevent overlapping times, ensure logical start/end

#### Shift Swapping (`/swaps`)

- **Available Shifts**: Browse shifts from other staff members
- **My Requests**: Track outgoing swap requests with status
- **Incoming Requests**: Handle swap requests from others
- **Constraint Checking**: Real-time validation showing why swaps might fail
- **Manager Approval**: Clear indication of approval requirements

#### Drop Requests (`/drops`)

- **Request Drop**: Submit shifts for others to claim
- **Browse Open Drops**: View unclaimed shifts with auto-claim functionality
- **My Drop Requests**: Track submitted drop requests with expiry times

### 3. Manager User Interface

#### Manager Dashboard (`/dashboard/manager`)

```typescript
interface ManagerDashboard {
  locationOverview: {
    locationId: string;
    name: string;
    timezone: string;
    stats: {
      totalShifts: number;
      staffedShifts: number;
      unstaffedShifts: number;
      pendingRequests: number;
    };
  }[];
  criticalIssues: {
    understaffedShifts: Shift[];
    overtimeWarnings: User[];
    expiredDropRequests: DropRequest[];
  };
  recentActivity: AuditLog[];
}
```

#### Schedule Management (`/schedule/manage`)

- **Shift Creation**: Create shifts with location, time, required skills, headcount
- **Drag & Drop**: Assign staff to shifts via drag-and-drop interface
- **Bulk Operations**: Create recurring shifts, copy week schedules
- **Constraint Visualization**: Real-time feedback on assignment validity
- **Publishing**: Publish schedules with staff notifications

#### Staff Management (`/staff`)

- **Staff Directory**: View all staff with skills, availability, locations
- **Certification Management**: Assign staff to locations
- **Performance Metrics**: Hours worked, reliability scores, skill utilization
- **Availability Overview**: Visual calendar showing staff availability patterns

#### Request Management (`/requests`)

```typescript
interface RequestManager {
  swapRequests: {
    pending: SwapRequest[];
    needsApproval: SwapRequest[];
    history: SwapRequest[];
  };
  dropRequests: {
    active: DropRequest[];
    expired: DropRequest[];
    claimed: DropRequest[];
  };
  actions: {
    approveSwap: (requestId: string) => void;
    rejectSwap: (requestId: string, reason: string) => void;
    extendDrop: (requestId: string, newExpiry: Date) => void;
  };
}
```

### 4. Admin User Interface

#### System Dashboard (`/dashboard/admin`)

- **Multi-location Overview**: System-wide statistics and health metrics
- **User Management**: Create/edit users, assign roles, manage permissions
- **Location Management**: Add/edit locations with timezones and settings
- **System Configuration**: Constraint rules, notification settings, cutoff times

#### Analytics & Reporting (`/analytics`)

- **Labor Cost Analysis**: Hours vs. budget tracking
- **Efficiency Metrics**: Shift fill rates, last-minute changes
- **Staff Performance**: Attendance, overtime patterns, skill utilization
- **Constraint Violations**: Historical data on scheduling conflicts

## Real-time Features

### Socket.io Integration

```typescript
// Socket events to implement:
interface SocketEvents {
  // Server to Client
  "shift-assigned": (assignment: ShiftAssignment) => void;
  "shift-updated": (shift: Shift) => void;
  "swap-requested": (request: SwapRequest) => void;
  "swap-approved": (request: SwapRequest) => void;
  "drop-claimed": (request: DropRequest) => void;
  "schedule-published": (locationId: string) => void;
  "overtime-warning": (userId: string, hours: number) => void;

  // Client to Server
  "join-location": (locationId: string) => void;
  "leave-location": (locationId: string) => void;
}
```

### Live Updates

- **Schedule Changes**: Real-time updates when shifts are modified
- **Request Status**: Instant feedback on swap/drop request changes
- **Notifications**: Toast notifications for important events
- **Presence Indicators**: Show who's currently viewing schedules

## Data Models & API Integration

### Key API Endpoints

```typescript
// Authentication
POST /auth/login
POST /auth/register
POST /auth/refresh

// Users
GET /users/profile
PUT /users/profile
GET /users/availability
PUT /users/availability

// Shifts
GET /shifts?locationId=&startDate=&endDate=
POST /shifts
PUT /shifts/:id
DELETE /shifts/:id
POST /shifts/:id/assign
DELETE /shifts/:id/unassign

// Swap Requests
GET /swaps
POST /swaps
PUT /swaps/:id/approve
PUT /swaps/:id/reject

// Drop Requests
GET /drops
POST /drops
POST /drops/:id/claim
```

### Data Transformations

```typescript
// Critical timezone conversions needed:
interface TimezoneFunctions {
  // Convert UTC from API to user's timezone
  toUserTime: (utcDate: Date, userTz: string) => Date;

  // Convert user input to UTC for API
  toUTC: (localTime: string, date: string, timezone: string) => Date;

  // Display time in location's timezone
  toLocationTime: (utcDate: Date, locationTz: string) => Date;

  // Handle overnight shifts spanning multiple days
  splitOvernight: (shift: Shift, timezone: string) => Shift[];
}
```

## UI/UX Requirements

### Design System

- **Colors**: Primary brand color, success/warning/error states
- **Typography**: Clear hierarchy, accessible font sizes
- **Spacing**: Consistent padding/margins using Tailwind
- **Components**: Reusable shadcn/ui components with customizations

### Responsive Design

- **Mobile First**: Touch-friendly interface for staff on phones
- **Tablet Optimized**: Manager interface suitable for tablet use
- **Desktop Full**: Admin interface utilizing full screen real estate

### Accessibility

- **Screen Reader**: Proper ARIA labels and semantic HTML
- **Keyboard Navigation**: Full functionality without mouse
- **Color Contrast**: WCAG AA compliance for text readability
- **Focus Management**: Clear focus indicators and logical tab order

## State Management Strategy

### Global State (Zustand)

```typescript
interface AppState {
  auth: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
  };
  ui: {
    sidebarOpen: boolean;
    currentLocation: string | null;
    notifications: Notification[];
  };
  realtime: {
    socket: Socket | null;
    connectionStatus: "connected" | "disconnected" | "reconnecting";
  };
}
```

### Server State (React Query)

- **Caching Strategy**: Cache schedule data with smart invalidation
- **Optimistic Updates**: Immediate UI updates with rollback on error
- **Background Sync**: Automatic refetching for critical data
- **Offline Support**: Basic offline capability with sync on reconnect

## Error Handling & Loading States

### Error Boundaries

- **Page-level**: Catch and display meaningful error pages
- **Component-level**: Graceful degradation for individual features
- **Network Errors**: Retry mechanisms with exponential backoff

### Loading States

- **Skeleton Components**: Show structure while data loads
- **Progress Indicators**: For long operations like schedule publishing
- **Lazy Loading**: Code splitting for optimal performance

## Security Considerations

### Frontend Security

- **XSS Prevention**: Sanitize all user inputs and API responses
- **CSRF Protection**: Proper token handling and validation
- **Route Protection**: Authentication guards on protected pages
- **Role-based Access**: Hide/disable features based on user role

### Data Validation

- **Client-side**: Zod schemas matching backend validation
- **Server Sync**: Ensure client/server validation stays in sync
- **Form Security**: Prevent injection attacks through forms

## Performance Optimization

### Core Web Vitals

- **LCP**: Optimize largest contentful paint with image optimization
- **FID**: Minimize first input delay with code splitting
- **CLS**: Prevent cumulative layout shift with proper sizing

### Data Loading

- **Prefetching**: Anticipate user navigation patterns
- **Pagination**: Handle large datasets efficiently
- **Virtualization**: For long lists of shifts/staff
- **Compression**: Optimize bundle sizes and API responses

## Testing Strategy

### Unit Tests

- **Components**: Test rendering and user interactions
- **Utilities**: Test timezone conversions and calculations
- **Hooks**: Test custom hooks and state management

### Integration Tests

- **User Flows**: Test complete workflows like shift swapping
- **API Integration**: Test API calls and error handling
- **Real-time**: Test socket connections and live updates

### E2E Tests

- **Critical Paths**: Login, schedule viewing, shift assignment
- **Cross-browser**: Ensure compatibility across browsers
- **Mobile**: Test touch interactions and responsive design

## Development Guidelines

### Code Organization

```
src/
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── stores/             # Zustand stores
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
└── constants/          # App constants
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ShiftCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useSchedule.ts`)
- **Utilities**: camelCase (e.g., `formatTime.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `API_ENDPOINTS`)

### Git Workflow

- **Feature Branches**: Create branches for each feature/bug fix
- **Commit Messages**: Follow conventional commits format
- **Pull Requests**: Require review and tests passing
- **Deployment**: Automated deployment on merge to main

## API Error Handling

### Error Response Format

```typescript
interface APIError {
  statusCode: number;
  message: string;
  error?: string;
  details?: any[];
}
```

### Common Error Scenarios

- **401 Unauthorized**: Redirect to login page
- **403 Forbidden**: Show permission denied message
- **404 Not Found**: Show not found page or fallback
- **422 Validation**: Display field-specific error messages
- **500 Server Error**: Show generic error with retry option

## Constraint Engine Integration

### Real-time Validation

The frontend should integrate with the backend's constraint engine to provide immediate feedback:

```typescript
interface ConstraintCheck {
  valid: boolean;
  violations: {
    type: "HARD" | "SOFT";
    rule: string;
    message: string;
    severity: "ERROR" | "WARNING";
  }[];
  suggestions?: string[];
}
```

### Visual Feedback

- **Green**: Assignment is valid with no constraints
- **Yellow**: Soft constraint violations (warnings)
- **Red**: Hard constraint violations (prevented)
- **Tooltips**: Detailed explanation of constraint violations

## Deployment & Environment Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development
```

### Build Configuration

- **Production**: Optimized builds with compression
- **Staging**: Mirror production with debug enabled
- **Development**: Hot reload with detailed error messages

This comprehensive guide provides the foundation for building a robust, scalable, and user-friendly frontend for the ShiftSync platform. Each section should be implemented incrementally, starting with core authentication and schedule viewing functionality before adding advanced features like real-time updates and constraint visualization.
