import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional guard for protected dashboard routes.
 * Redirects unauthenticated users to the login page.
 */
export const dashboardGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Use cached auth state instead of making API calls
  if (authService.isAuthenticated()) {
    // User is logged in, allow access to dashboard
    return true;
  }

  // User is not logged in, redirect to login
  router.navigate(['/login']);
  return false;
};
