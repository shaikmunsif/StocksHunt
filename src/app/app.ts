import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { LayoutService } from './services/layout.service';
import { SidebarComponent } from './components/sidebar/sidebar';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle';
import { ShimmerLoaderComponent } from './components/shimmer-loader/shimmer-loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ThemeToggleComponent, ShimmerLoaderComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = 'StocksPulse';
  readonly currentYear = new Date().getFullYear();
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  layoutService = inject(LayoutService);
  router = inject(Router);
  isLoadingRoute = false;

  constructor() {
    // Listen to router events to show shimmer during lazy loading
    this.router.events
      .pipe(takeUntilDestroyed())
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.isLoadingRoute = true;
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.isLoadingRoute = false;
        }
      });
  }

  logout() {
    this.authService.logout();
  }
}
