import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional guard for login/register routes.
 * Redirects authenticated users to the dashboard.
 */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Check current authentication state
    if (authService.isAuthenticated()) {
      // User is logged in, redirect to manage-data for both login and register routes
      router.navigate(['/manage-data']);
      return false;
    }

    // Also check with Supabase directly to be sure
    const {
      data: { session },
    } = await authService.supabase.auth.getSession();

    if (session?.user) {
      // User has an active session, redirect to manage-data
      router.navigate(['/manage-data']);
      return false;
    }

    // User is not logged in, allow access to login/register
    return true;
  } catch (error) {
    console.error('authGuard error:', error);
    // On error, allow access to login/register
    return true;
  }
};
