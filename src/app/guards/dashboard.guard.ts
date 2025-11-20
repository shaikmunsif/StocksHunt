import { inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export class DashboardGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate() {
    // Use cached auth state instead of making API calls
    if (this.authService.isAuthenticated()) {
      // User is logged in, allow access to dashboard
      return true;
    }

    // User is not logged in, redirect to login
    this.router.navigate(['/login']);
    return false;
  }
}
