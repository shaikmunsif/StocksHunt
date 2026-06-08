# StockGainers - Project Summary

> **Last Updated:** June 8, 2026
> **Angular Version:** 21.x
> **Change Detection:** Zoneless (Signals only)
> **Status:** Production Ready

---

## Project Overview

StockGainers is a professional Angular application for analyzing stock market performance data. It provides advanced filtering, data visualization, interactive modals with navigation, and comprehensive export capabilities.

### Key Features

- **Authentication** - Supabase-powered auth with JWT sessions
- **Dual Analysis Views** - Date-wise and threshold-based stock analysis
- **Interactive Charts** - Historical price visualization with Chart.js (lazy-loaded)
- **Zoneless** - Fully signal-based change detection, no Zone.js dependency
- **Theme System** - Dark/light mode with localStorage persistence
- **Fully Responsive** - Mobile-first design with touch optimization
- **CSV Export** - Export filtered data with current state
- **Interactive Modals** - Edit company details with swipe navigation

---

## Technology Stack

| Category              | Technology                                     |
| --------------------- | ---------------------------------------------- |
| **Framework**         | Angular 21 (Standalone Components, Zoneless)   |
| **Change Detection**  | `provideZonelessChangeDetection()` — no Zone.js |
| **UI**                | Tailwind CSS 3.x                               |
| **State**             | Angular Signals & @ngrx/signals                |
| **Auth**              | Supabase Auth                                  |
| **Database**          | Supabase PostgreSQL with RLS & RPC             |
| **Charts**            | Chart.js 4.x (dynamic import)                  |
| **Build**             | Angular CLI with esbuild                       |
| **Language**          | TypeScript 5.9 (strict mode)                   |

---

## Zoneless Architecture

The application runs without Zone.js. All change detection is driven by Angular signals:

- **`signal()`** for mutable component state
- **`computed()`** for derived values
- **`input()` / `input.required()`** for component inputs (replaces `@Input()`)
- **`provideZonelessChangeDetection()`** in app config enables signal-scheduled CD
- Signal writes inside `async/await`, `setTimeout`, `setInterval`, and Promise callbacks automatically trigger change detection
- Dynamic component data passing uses `componentRef.setInput()` instead of `Object.assign`

---

## Project Structure

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
│   ├── theme-toggle/               # Theme switcher
│   └── svg/icons/                  # Icon components
├── services/
│   ├── auth.service.ts             # Authentication (signal-based state)
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

---

## Modern Angular Patterns

### Zoneless Change Detection

```typescript
// app.config.ts
providers: [
  provideZonelessChangeDetection(),
  provideRouter(routes),
  // ...
]
```

### Signal-Based State

```typescript
export class GainersViewDateComponent {
  marketData = signal<MarketDataResponse | null>(null);
  isLoading = signal(false);
  maxDate = signal('');
  maxDateKey = computed(() => this.toDateKey(this.maxDate()));

  async loadMarketData(): Promise<void> {
    this.isLoading.set(true);
    const data = await this.databaseService.getMarketDataByDate(this.selectedDate());
    this.marketData.set(data);
    this.isLoading.set(false);
    // No ChangeDetectorRef needed — signal writes trigger CD
  }
}
```

### Signal Inputs

```typescript
export class CommentModalComponent {
  readonly companyId = input.required<string>();
  readonly companyName = input.required<string>();
  readonly comment = input<string>('');
  commentText = signal<string>('');
}
```

### Modern Control Flow

```html
@if (isLoading()) {
  <app-shimmer-loader type="table" [rows]="10"></app-shimmer-loader>
} @for (company of marketData()?.companies ?? []; track company.ticker_symbol) {
  <tr>{{ company.name }}</tr>
}
```

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

### Inject Function

```typescript
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);
}
```

---

## Analysis Views

### Date-Wise Analysis (`/analysis/date-wise`)

- View stock gainers by specific dates
- Exchange filtering (NSE/BSE)
- Full column sorting (ticker, name, price, change, category, occurrences)
- Interactive row editing with modal navigation
- CSV export with current filters
- **Optimized**: Single RPC call with pre-calculated occurrence counts

### Threshold Analysis (`/analysis/threshold`)

- Find companies appearing multiple times
- Configurable threshold (1-10+)
- Exchange modes: All, Specific, None
- Average change calculations
- Previous/Next modal navigation
- **Optimized**: Single RPC call with server-side filtering

---

## Responsive Design

### Breakpoints

| Breakpoint  | Width          | Layout                       |
| ----------- | -------------- | ---------------------------- |
| **Mobile**  | < 640px        | Card layouts, hamburger menu |
| **Tablet**  | 640px - 1023px | Adaptive layouts             |
| **Desktop** | >= 1024px      | Full sidebar, table views    |

### Mobile Features

- Hamburger menu with slide-in drawer
- Swipe gestures for navigation
- Card-based data views
- Touch-optimized buttons (48px min)
- 16px font size (prevents zoom)

---

## Key Services

### AuthService

- Supabase integration with JWT
- Signal-based session management (`currentUser` signal)
- Email confirmation flow
- Logout with state cleanup

### DatabaseService

- RPC-based data operations (`get_market_data_by_date`, `get_company_market_summary`)
- CRUD operations for companies, categories, exchanges
- Historical data retrieval
- Category management
- SECURITY INVOKER for automatic RLS enforcement

### DialogService

- `setInput()`-based data passing for signal input compatibility
- `updateInputs()` method for modal navigation
- Dynamic component creation with proper lifecycle

### BreakpointService

- Signal-based responsive detection
- `isMobile()`, `isTablet()`, `isDesktop()`
- Window resize handling with cleanup

---

## Bundle Optimization

| Bundle           | Size     | Strategy                 |
| ---------------- | -------- | ------------------------ |
| **Initial**      | ~534 kB  | Route-based splitting    |
| **Chart.js**     | 205 kB   | Dynamic import on-demand |
| **Route chunks** | 12-35 kB | Lazy loading             |

### API Optimization

- **RPC Functions**: Reduced API calls from 101 to 2 (for 50 companies)
- **Server-side Filtering**: Threshold and exchange filtering done in database
- **Pre-calculated Metrics**: Occurrence counts computed in SQL

---

## Quick Start

```bash
# Install dependencies
npm install

# Development server
npm start
# -> http://localhost:4200/

# Production build
npm run build
```

### Environment Setup

Create `.env` file:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

---

## Routes

| Route                 | Component                     | Guard          |
| --------------------- | ----------------------------- | -------------- |
| `/login`              | LoginComponent                | authGuard      |
| `/register`           | RegisterComponent             | authGuard      |
| `/stock-data-entry`   | StockDataEntryComponent       | dashboardGuard |
| `/analysis/date-wise` | GainersViewDateComponent      | dashboardGuard |
| `/analysis/threshold` | GainersViewThresholdComponent | dashboardGuard |

---

## Documentation

| Document                         | Description              |
| -------------------------------- | ------------------------ |
| [README.md](./README.md)         | Quick start and overview |
| [docs/archive/](./docs/archive/) | Historical documentation |

---

## Author

**Shaik Munsif** - [@shaikmunsif](https://github.com/shaikmunsif)

---

Built with Angular 21 (zoneless) and modern web technologies.
