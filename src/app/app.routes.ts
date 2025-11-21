import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { DashboardGuard } from './guards/dashboard.guard';

export const routes: Routes = [
  {
    path: 'manage-data',
    loadComponent: () =>
      import('./components/stock-gainers/stock-gainers').then((m) => m.StockGainersComponent),
    canActivate: [DashboardGuard],
  },
  {
    path: 'analysis/date-wise',
    loadComponent: () =>
      import('./components/gainers-view-date/gainers-view-date').then(
        (m) => m.GainersViewDateComponent
      ),
    canActivate: [DashboardGuard],
  },
  {
    path: 'analysis/threshold',
    loadComponent: () =>
      import('./components/gainers-view-threshold/gainers-view-threshold').then(
        (m) => m.GainersViewThresholdComponent
      ),
    canActivate: [DashboardGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then((m) => m.RegisterComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then((m) => m.LoginComponent),
    canActivate: [AuthGuard],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
