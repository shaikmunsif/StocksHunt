import { inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  async canActivate(): Promise<boolean> {
    try {
      // Check current authentication state
      if (this.authService.isAuthenticated()) {
        // User is logged in, redirect to dashboard for both login and register routes
        this.router.navigate(['/dashboard']);
        return false;
      }

      // Also check with Supabase directly to be sure
      const {
        data: { session },
      } = await this.authService.supabase.auth.getSession();

      if (session?.user) {
        // User has an active session, redirect to dashboard
        this.router.navigate(['/dashboard']);
        return false;
      }

      // User is not logged in, allow access to login/register
      return true;
    } catch (error) {
      console.error('AuthGuard error:', error);
      // On error, allow access to login/register
      return true;
    }
  }
}
