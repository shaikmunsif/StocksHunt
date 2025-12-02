import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { dashboardGuard } from './guards/dashboard.guard';

export const routes: Routes = [
  {
    path: 'stock-data-entry',
    loadComponent: () =>
      import('./components/stock-data-entry/stock-data-entry').then(
        (m) => m.StockDataEntryComponent
      ),
    canActivate: [dashboardGuard],
  },
  {
    path: 'analysis/date-wise',
    loadComponent: () =>
      import('./components/gainers-view-date/gainers-view-date').then(
        (m) => m.GainersViewDateComponent
      ),
    canActivate: [dashboardGuard],
  },
  {
    path: 'analysis/threshold',
    loadComponent: () =>
      import('./components/gainers-view-threshold/gainers-view-threshold').then(
        (m) => m.GainersViewThresholdComponent
      ),
    canActivate: [dashboardGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then((m) => m.RegisterComponent),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then((m) => m.LoginComponent),
    canActivate: [authGuard],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
