# StockGainers

> A professional Angular 21 application for analyzing stock market performance data with advanced filtering, data visualization, and comprehensive export capabilities.

[![Angular](https://img.shields.io/badge/Angular-21.2-DD0031?logo=angular)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.81-3ECF8E?logo=supabase)](https://supabase.com/)

## Features

- **Secure Authentication** - Supabase-powered auth with JWT sessions
- **Dual Analysis Views** - Date-wise and threshold-based stock analysis
- **Interactive Charts** - Historical price visualization with Chart.js (lazy-loaded)
- **Dark Mode** - Complete theme system with localStorage persistence
- **Fully Responsive** - Mobile-first design with touch optimization
- **Zoneless Change Detection** - Fully signal-based reactivity, no Zone.js
- **Performance Optimized** - Route-based lazy loading with dynamic imports
- **Type-Safe** - Complete TypeScript coverage with strict mode
- **CSV Export** - Export filtered data with current state
- **Interactive Modals** - Edit company details with swipe navigation

## Technology Stack

- **Frontend**: Angular 21 (Standalone Components, Zoneless)
- **UI Framework**: Tailwind CSS 3.x
- **State Management**: Angular Signals & @ngrx/signals
- **Change Detection**: Zoneless (`provideZonelessChangeDetection`)
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL with RLS & RPC functions
- **Charts**: Chart.js 4.x (dynamically imported)
- **Build Tool**: Angular CLI with esbuild
- **TypeScript**: Strict mode enabled

## Quick Start

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

## Bundle Optimization

- **Initial Bundle**: ~534 kB
- **Lazy Chunks**:
  - Chart.js: 205 kB (loaded on-demand)
  - Route components: 12-35 kB each
- **Optimization Strategies**:
  - Route-based lazy loading with `loadComponent()`
  - Dynamic Chart.js import (type-only imports)
  - Zoneless change detection (no Zone.js overhead)
  - Tree-shaking and dead code elimination
  - Optimized RPC functions for single API calls

## Key Features Explained

### Authentication System

- Email/password authentication with Supabase
- JWT-based session management
- Email confirmation flow
- Protected routes with functional guards
- Automatic logout on session expiry

### Analysis Views

#### Date-Wise Analysis

- View stock gainers by specific dates
- Filter by exchange (NSE/BSE)
- Sort by multiple columns with smart defaults
- Occurrence count tracking (via RPC function)
- Single API call for all data

#### Threshold Analysis

- Analyze companies appearing multiple times
- Configurable threshold filters (1-10+ occurrences)
- Average percentage change calculations
- Exchange filtering modes (All, Specific, None)
- Single API call with server-side filtering

### Interactive Modals

- Edit company categories and comments
- Historical price charts (Chart.js)
- Previous/Next navigation
- Mobile swipe gestures
- Real-time data updates via signals

### Theme System

- Global dark/light mode toggle
- Persistent theme preference
- Smooth transitions
- System preference detection

## Mobile Experience

- **Responsive Navigation**: Hamburger menu with swipe gestures
- **Touch-Optimized**: 48px minimum tap targets
- **Card Layouts**: Mobile-friendly data display
- **Swipe Navigation**: Sidebar and modal swipe support
- **Adaptive Forms**: 16px font size (prevents zoom)

## Architecture

```
src/app/
├── components/
│   ├── sidebar/                    # Navigation with swipe gestures
│   ├── gainers-view-date/          # Date-wise analysis
│   ├── gainers-view-threshold/     # Threshold analysis
│   ├── stock-data-entry/           # Stock data entry & management
│   ├── login/                      # Authentication
│   ├── register/                   # User registration
│   ├── dialog/                     # Modal system (setInput-based)
│   ├── edit-company-modal/         # Company editor with navigation
│   ├── comment-modal/              # Comments editor
│   ├── shimmer-loader/             # Loading skeleton
│   ├── toast-message/              # Notifications
│   └── theme-toggle/               # Theme switcher
├── services/
│   ├── auth.service.ts             # Authentication (signal-based)
│   ├── database.service.ts         # Data operations
│   ├── stock.service.ts            # Stock data handling
│   ├── theme.service.ts            # Theme management
│   ├── breakpoint.service.ts       # Responsive utilities
│   ├── layout.service.ts           # Layout state
│   └── dialog.service.ts           # Modal management
├── guards/
│   ├── auth.guard.ts               # Functional route guard
│   └── dashboard.guard.ts          # Functional route guard
├── interfaces/
│   └── stock-data.interface.ts     # Type definitions
├── stores/
│   ├── category.store.ts           # @ngrx/signals category state
│   └── company.store.ts            # @ngrx/signals company state
├── utils/
│   └── format.utils.ts             # Shared formatters
├── shared/
│   └── index.ts                    # Barrel exports
├── app.routes.ts                   # Lazy-loaded routes
├── app.config.ts                   # Zoneless app configuration
└── app.ts                          # Root component
```

## Configuration

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

### Environment Variables

Set up in `.env`:

```bash
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_anon_key
```

## Performance

- **Initial Bundle**: 534 kB
- **Lazy Loading**: All routes and Chart.js
- **Change Detection**: Zoneless — signal writes automatically trigger CD
- **RPC Optimization**: Reduced API calls from 101 to 2 (for 50 companies)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Best Practices Implemented

- Standalone components (default in Angular 21)
- Zoneless change detection with `provideZonelessChangeDetection()`
- Angular Signals for all reactive state (no `ChangeDetectorRef`)
- Signal inputs (`input()` / `input.required()`)
- `computed()` for derived state
- Functional guards (`CanActivateFn`)
- `inject()` function for dependency injection
- Modern control flow (`@if`, `@for`, `@switch`)
- Granular imports (no `CommonModule`)
- Lazy loading with `loadComponent()`
- Dynamic imports for heavy libraries (Chart.js)
- TypeScript strict mode
- `@ngrx/signals` for shared entity stores
- Shared utilities for DRY code
- Proper cleanup (`DestroyRef`, `OnDestroy`)

## Documentation

- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Comprehensive project documentation
- [docs/archive/](./docs/archive/) - Historical documentation and changelogs

## Resources

- [Angular Documentation](https://angular.dev/)
- [Angular Zoneless Guide](https://angular.dev/guide/zoneless)
- [Angular Signals](https://angular.dev/guide/signals)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Chart.js Documentation](https://www.chartjs.org/)

## License

This project is licensed under the MIT License.

## Author

**Shaik Munsif**

- GitHub: [@shaikmunsif](https://github.com/shaikmunsif)

---

Built with Angular 21 (zoneless) and modern web technologies.
