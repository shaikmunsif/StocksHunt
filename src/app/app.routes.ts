import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register';
import { LoginComponent } from './components/login/login';
import { StockGainersComponent } from './components/stock-gainers/stock-gainers';
import { GainersViewDateComponent } from './components/gainers-view-date/gainers-view-date';
import { GainersViewThresholdComponent } from './components/gainers-view-threshold/gainers-view-threshold';
import { AuthGuard } from './guards/auth.guard';
import { DashboardGuard } from './guards/dashboard.guard';

export const routes: Routes = [
  {
    path: 'manage-data',
    component: StockGainersComponent,
    canActivate: [DashboardGuard],
  },
  {
    path: 'analysis/date-wise',
    component: GainersViewDateComponent,
    canActivate: [DashboardGuard],
  },
  {
    path: 'analysis/threshold',
    component: GainersViewThresholdComponent,
    canActivate: [DashboardGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard],
  },
  // Redirect old routes if user tries to access them
  { path: 'dashboard', redirectTo: '/manage-data', pathMatch: 'full' },
  { path: 'stock-gainers', redirectTo: '/manage-data', pathMatch: 'full' },
  { path: 'gainers-view-date', redirectTo: '/analysis/date-wise', pathMatch: 'full' },
  { path: 'gainers-view-threshold', redirectTo: '/analysis/threshold', pathMatch: 'full' },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];
