# 📊 StockGainers

> A professional Angular 20+ application for analyzing stock market performance data with advanced filtering, data visualization, and comprehensive export capabilities.

[![Angular](https://img.shields.io/badge/Angular-20.3-DD0031?logo=angular)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.81-3ECF8E?logo=supabase)](https://supabase.com/)

## ✨ Features

- 🔐 **Secure Authentication** - Supabase-powered auth with JWT sessions
- 📊 **Dual Analysis Views** - Date-wise and threshold-based stock analysis
- 📈 **Interactive Charts** - Historical price visualization with Chart.js (lazy-loaded)
- 🎨 **Dark Mode** - Complete theme system with localStorage persistence
- 📱 **Fully Responsive** - Mobile-first design with touch optimization
- 🚀 **Performance Optimized** - 40% bundle reduction through lazy loading
- 🎯 **Type-Safe** - Complete TypeScript coverage with strict mode
- 💾 **CSV Export** - Export filtered data with current state
- 🔄 **Real-Time Updates** - Live data synchronization with Supabase
- ✏️ **Interactive Modals** - Edit company details with swipe navigation

## 🏗️ Technology Stack

- **Frontend**: Angular 20+ (Standalone Components)
- **UI Framework**: Tailwind CSS 3.x
- **State Management**: Angular Signals & RxJS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL with RLS
- **Charts**: Chart.js 4.x (dynamically imported)
- **Build Tool**: Angular CLI with optimization
- **TypeScript**: Strict mode enabled

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

```bash
# Clone the repository
git clone https://github.com/shaikmunsif/StocksHunt.git
cd AuthAndAuth

# Install dependencies
npm install

# Set up environment variables
# Create .env file with your Supabase credentials
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### Development

```bash
# Start development server
npm start
# or
ng serve

# Open browser to http://localhost:4200/
```

### Production Build

```bash
# Build optimized production bundle
npm run build

# Preview production build
npm run preview
```

## 📦 Bundle Optimization

Our application uses advanced optimization techniques:

- **Initial Bundle**: 560.77 kB (down from 942 kB - 40% reduction)
- **Lazy Chunks**:
  - Chart.js: 205 kB (loaded on-demand)
  - Route components: 12-43 kB each
- **Optimization Strategies**:
  - Route-based lazy loading with `loadComponent()`
  - Dynamic Chart.js import (type-only imports)
  - Optimized CSS bundles (4.51 kB sidebar styles)
  - Tree-shaking and dead code elimination

## 🎯 Key Features Explained

### 🔐 Authentication System

- Email/password authentication with Supabase
- JWT-based session management
- Email confirmation flow
- Protected routes with guards
- Automatic logout on session expiry

### 📊 Analysis Views

#### Date-Wise Analysis

- View stock gainers by specific dates
- Filter by date range and percentage thresholds
- Sort by multiple columns
- Occurrence count tracking

#### Threshold Analysis

- Analyze companies appearing multiple times
- Configurable threshold filters (3+ occurrences)
- Average percentage change calculations
- Smart filtering and sorting

### 📈 Interactive Modals

- Edit company categories and comments
- Historical price charts (Chart.js)
- Previous/Next navigation
- Mobile swipe gestures
- Real-time data updates

### 🎨 Theme System

- Global dark/light mode toggle
- Persistent theme preference
- Smooth transitions
- System preference detection
- Optimized for both themes

## 📱 Mobile Experience

- **Responsive Navigation**: Hamburger menu with swipe gestures
- **Touch-Optimized**: 48px minimum tap targets
- **Card Layouts**: Mobile-friendly data display
- **Swipe Navigation**: Sidebar and modal swipe support
- **Adaptive Forms**: 16px font size (prevents zoom)
- **Performance**: Optimized rendering for mobile devices

## 🏛️ Architecture

```
src/app/
├── components/
│   ├── sidebar/              # Navigation with swipe gestures
│   ├── dashboard/            # Main landing page
│   ├── gainers-view-date/    # Date-wise analysis
│   ├── gainers-view-threshold/ # Threshold analysis
│   ├── stock-gainers/        # Data management
│   ├── login/               # Authentication
│   ├── register/            # User registration
│   ├── dialog/              # Modal system
│   ├── edit-company-modal/  # Company details editor
│   └── theme-toggle/        # Theme switcher
├── services/
│   ├── auth.service.ts      # Authentication logic
│   ├── database.service.ts  # Data operations
│   ├── theme.service.ts     # Theme management
│   ├── stock.service.ts     # Stock data handling
│   ├── breakpoint.service.ts # Responsive utilities
│   └── layout.service.ts    # Layout state
├── guards/
│   ├── auth.guard.ts        # Route protection
│   └── dashboard.guard.ts   # Dashboard access
├── interfaces/
│   └── stock-data.interface.ts # Type definitions
├── app.routes.ts            # Lazy-loaded routes
└── main.ts                  # Application bootstrap
```

## 🎨 Code Scaffolding

Generate new components using Angular CLI:

```bash
# Generate a standalone component
ng generate component component-name --standalone

# Generate a service
ng generate service services/service-name

# Generate an interface
ng generate interface interfaces/interface-name
```

## 🧪 Testing

```bash
# Run unit tests
ng test

# Run e2e tests (configure framework first)
ng e2e
```

## 🔧 Configuration

### Tailwind CSS

Configure in `tailwind.config.js`:

```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      // Your custom theme
    },
  },
};
```

### Angular Build

Configure in `angular.json`:

- Budget optimization settings
- Production configurations
- Asset management

### Environment Variables

Set up in `.env`:

```bash
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
```

## 📊 Performance

- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: 560 kB initial (optimized)
- **Lazy Loading**: All routes and Chart.js

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Best Practices Implemented

- ✅ Standalone components (no NgModules)
- ✅ Angular Signals for reactive state
- ✅ Host bindings instead of decorators
- ✅ Direct class bindings over `[ngClass]`
- ✅ Modern control flow (`@if`, `@for`, `@switch`)
- ✅ Type-only imports for tree-shaking
- ✅ Lazy loading with `loadComponent()`
- ✅ Dynamic imports for heavy libraries
- ✅ TypeScript strict mode
- ✅ Mobile-first responsive design

## 📚 Documentation

- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Comprehensive project documentation
- [MOBILE_COMPLETION_SUMMARY.md](./MOBILE_COMPLETION_SUMMARY.md) - Mobile implementation details
- [ENHANCED_FEATURES_SUMMARY.md](./ENHANCED_FEATURES_SUMMARY.md) - Feature enhancements

## 🔗 Resources

- [Angular Documentation](https://angular.dev/)
- [Angular CLI Reference](https://angular.dev/tools/cli)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Chart.js Documentation](https://www.chartjs.org/)

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Shaik Munsif**

- GitHub: [@shaikmunsif](https://github.com/shaikmunsif)

---

**Built with ❤️ using Angular 20 and modern web technologies**
