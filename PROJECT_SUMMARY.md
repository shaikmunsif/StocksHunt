# 📊 StockGainers - Project Summary

> **Last Updated:** November 30, 2025  
> **Angular Version:** 20.x  
> **Status:** Production Ready ✅

---

## 🎯 Project Overview

StockGainers is a professional Angular application for analyzing stock market performance data. It provides advanced filtering, data visualization, interactive modals with navigation, and comprehensive export capabilities.

### Key Features

- 🔐 **Authentication** - Supabase-powered auth with JWT sessions
- 📊 **Dual Analysis Views** - Date-wise and threshold-based stock analysis
- 📈 **Interactive Charts** - Historical price visualization with Chart.js (lazy-loaded)
- 🎨 **Theme System** - Dark/light mode with localStorage persistence
- 📱 **Fully Responsive** - Mobile-first design with touch optimization
- 💾 **CSV Export** - Export filtered data with current state
- ✏️ **Interactive Modals** - Edit company details with swipe navigation

---

## 🏗️ Technology Stack

| Category      | Technology                          |
| ------------- | ----------------------------------- |
| **Framework** | Angular 20+ (Standalone Components) |
| **UI**        | Tailwind CSS 3.x                    |
| **State**     | Angular Signals & RxJS              |
| **Auth**      | Supabase Auth                       |
| **Database**  | Supabase PostgreSQL with RLS        |
| **Charts**    | Chart.js 4.x (dynamic import)       |
| **Build**     | Angular CLI with esbuild            |
| **Language**  | TypeScript (strict mode)            |

---

## 📁 Project Structure

```
src/app/
├── components/
│   ├── sidebar/                    # Navigation with swipe gestures
│   ├── gainers-view-date/          # Date-wise analysis
│   ├── gainers-view-threshold/     # Threshold analysis
│   ├── stock-gainers/              # Data management
│   ├── login/                      # Authentication
│   ├── register/                   # User registration
│   ├── dialog/                     # Modal system
│   ├── edit-company-modal/         # Company editor
│   ├── comment-modal/              # Comments editor
│   ├── shimmer-loader/             # Loading skeleton
│   ├── toast-message/              # Notifications
│   ├── theme-toggle/               # Theme switcher
│   └── svg/icons/                  # Icon components
├── services/
│   ├── auth.service.ts             # Authentication
│   ├── database.service.ts         # Data operations
│   ├── stock.service.ts            # Stock data handling
│   ├── theme.service.ts            # Theme management
│   ├── breakpoint.service.ts       # Responsive utilities
│   ├── layout.service.ts           # Layout state
│   └── dialog.service.ts           # Modal management
├── guards/
│   ├── auth.guard.ts               # Login/register protection
│   └── dashboard.guard.ts          # Dashboard protection
├── interfaces/
│   └── stock-data.interface.ts     # Type definitions
├── stores/
│   ├── category.store.ts           # Category state
│   └── company.store.ts            # Company state
├── utils/
│   └── format.utils.ts             # Shared formatters
├── shared/
│   └── index.ts                    # Barrel exports
├── app.routes.ts                   # Lazy-loaded routes
├── app.config.ts                   # App configuration
└── app.ts                          # Root component
```

---

## 🎨 Modern Angular Patterns

### Functional Guards

```typescript
export const dashboardGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};
```

### Signal Inputs

```typescript
@Component({ ... })
export class ToastMessageComponent {
  readonly message = input<ToastMessage | null>(null);
}
```

### Modern Control Flow

```html
@if (isLoading) {
<app-shimmer-loader type="table" [rows]="10"></app-shimmer-loader>
} @for (company of companies; track company.id) {
<tr>
  {{ company.name }}
</tr>
}
```

### Inject Function

```typescript
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);
}
```

---

## 📊 Analysis Views

### Date-Wise Analysis (`/analysis/date-wise`)

- View stock gainers by specific dates
- Exchange filtering (NSE/BSE)
- Full column sorting (ticker, name, price, change, category, occurrences)
- Interactive row editing with modal navigation
- CSV export with current filters

### Threshold Analysis (`/analysis/threshold`)

- Find companies appearing multiple times
- Configurable threshold (1-10+)
- Exchange modes: All, Specific, None
- Average change calculations
- Previous/Next modal navigation

---

## 📱 Responsive Design

### Breakpoints

| Breakpoint  | Width          | Layout                       |
| ----------- | -------------- | ---------------------------- |
| **Mobile**  | < 640px        | Card layouts, hamburger menu |
| **Tablet**  | 640px - 1023px | Adaptive layouts             |
| **Desktop** | ≥ 1024px       | Full sidebar, table views    |

### Mobile Features

- Hamburger menu with slide-in drawer
- Swipe gestures for navigation
- Card-based data views
- Touch-optimized buttons (48px min)
- 16px font size (prevents zoom)

---

## 🔧 Key Services

### AuthService

- Supabase integration with JWT
- Session management with signals
- Email confirmation flow
- Logout with state cleanup

### DatabaseService

- CRUD operations for all entities
- Historical data retrieval
- Occurrence counting
- Category management

### BreakpointService

- Signal-based responsive detection
- `isMobile()`, `isTablet()`, `isDesktop()`
- Window resize handling with cleanup

---

## 📦 Bundle Optimization

| Bundle           | Size     | Strategy                 |
| ---------------- | -------- | ------------------------ |
| **Initial**      | 570 kB   | Route-based splitting    |
| **Chart.js**     | 205 kB   | Dynamic import on-demand |
| **Route chunks** | 12-43 kB | Lazy loading             |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Development server
npm start
# → http://localhost:4200/

# Production build
npm run build

# Run tests
npm test
```

### Environment Setup

Create `.env` file:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

---

## 🗺️ Routes

| Route                 | Component                     | Guard          |
| --------------------- | ----------------------------- | -------------- |
| `/login`              | LoginComponent                | authGuard      |
| `/register`           | RegisterComponent             | authGuard      |
| `/manage-data`        | StockGainersComponent         | dashboardGuard |
| `/analysis/date-wise` | GainersViewDateComponent      | dashboardGuard |
| `/analysis/threshold` | GainersViewThresholdComponent | dashboardGuard |

---

## 📖 Documentation

| Document                         | Description              |
| -------------------------------- | ------------------------ |
| [README.md](./README.md)         | Quick start and overview |
| [docs/archive/](./docs/archive/) | Historical documentation |

---

## 👤 Author

**Shaik Munsif** - [@shaikmunsif](https://github.com/shaikmunsif)

---

**Built with ❤️ using Angular 20 and modern web technologies**
