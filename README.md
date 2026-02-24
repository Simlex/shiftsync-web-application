# 🍽️ ShiftSync Web Application

**Modern Staff Scheduling Dashboard for Restaurant Chains**

A comprehensive React-based web application built with Next.js and TypeScript for managing restaurant staff scheduling across multiple locations. Features real-time shift management, intelligent staff assignment with constraint validation, and role-based access control for admins, managers, and staff members.

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![React Query](https://img.shields.io/badge/React-Query-FF4154?style=for-the-badge&logo=react-query)](https://tanstack.com/query)

</div>

## ✨ Features

### 🏢 **Multi-Location Management**

- Manage multiple restaurant locations from a unified dashboard
- Location-specific staff assignments and certifications
- Cross-timezone scheduling with intelligent time conversion

### 👥 **Intelligent Staff Scheduling**

- Interactive shift calendar with drag-and-drop functionality
- AI-powered staff assignment with scoring algorithm
- Constraint-based validation preventing conflicts and overtime

### 🔄 **Workforce Flexibility**

- Shift swap requests with manager approval workflow
- Drop shift system for last-minute schedule changes
- Real-time availability checking and notifications

### 🎯 **Role-Based Access Control**

- **Admin**: Full system oversight and configuration
- **Manager**: Location-specific staff and schedule management
- **Staff**: Personal schedule management and swap requests

### 📱 **Modern User Experience**

- Responsive design optimized for mobile and desktop
- Real-time updates via WebSocket integration
- Dark/light theme support with system preference detection

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Access to ShiftSync API server

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/shiftsync-web-application.git
   cd shiftsync-web-application
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env.local
   ```

   Configure your environment variables:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   ```

4. **Start the development server**

   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

| Technology         | Purpose                                  | Version |
| ------------------ | ---------------------------------------- | ------- |
| **Next.js**        | React framework with SSR/SSG             | 14.x    |
| **TypeScript**     | Type-safe JavaScript                     | 5.x     |
| **TanStack Query** | Server state management                  | 5.x     |
| **Tailwind CSS**   | Utility-first CSS framework              | 3.x     |
| **Shadcn/ui**      | Modern component library                 | Latest  |
| **Luxon**          | Date/time handling with timezone support | 3.x     |
| **NextAuth.js**    | Authentication solution                  | 4.x     |
| **Recharts**       | Data visualization library               | 2.x     |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── admin/             # Admin dashboard pages
│   ├── manager/           # Manager dashboard pages
│   └── staff/             # Staff dashboard pages
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard-specific components
│   └── dialogs/          # Modal dialogs
├── contexts/             # React Context providers
├── hooks/               # Custom React hooks
├── lib/                # Utility functions and configs
├── services/           # API service functions
├── types/              # TypeScript type definitions
└── constants/          # Application constants
```

## 🔧 Available Scripts

| Command           | Description                   |
| ----------------- | ----------------------------- |
| `pnpm dev`        | Start development server      |
| `pnpm build`      | Build for production          |
| `pnpm start`      | Start production server       |
| `pnpm lint`       | Run ESLint                    |
| `pnpm type-check` | Run TypeScript compiler check |

## 🌐 Key Pages & Features

### Admin Dashboard (`/admin`)

- **Locations**: Manage restaurant locations and settings
- **Users**: Staff management and role assignments
- **Swaps**: Review and approve shift swap requests
- **Analytics**: System-wide reporting and insights

### Manager Dashboard (`/manager`)

- **Schedule**: Location-specific shift management
- **Staff**: Team member oversight and assignments
- **Requests**: Handle drop and swap requests
- **Reports**: Location performance metrics

### Staff Portal (`/staff`)

- **My Schedule**: Personal shift calendar
- **Availability**: Set recurring availability patterns
- **Requests**: Submit swap and drop requests
- **Profile**: Manage personal information and skills

## 🔐 Authentication Flow

1. **Login**: Email/password authentication via NextAuth.js
2. **Role Detection**: Automatic redirect based on user role
3. **Session Management**: Secure JWT token handling
4. **Route Protection**: Role-based route access control

## 🚀 Deployment

### Production Build

```bash
pnpm build
pnpm start
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables (Production)

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_URL=wss://your-api-domain.com
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=production-secret-key
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an [issue](https://github.com/yourusername/shiftsync-web-application/issues)
- Check our [documentation](https://docs.shiftsync.com)
- Contact the development team

---

<div align="center">

**Built with ❤️ for restaurant workforce management**

</div>
