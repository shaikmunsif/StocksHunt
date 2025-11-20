import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { LayoutService } from './services/layout.service';
import { SidebarComponent } from './components/sidebar/sidebar';
import { ThemeToggleComponent } from './components/theme-toggle/theme-toggle';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ThemeToggleComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = 'StocksPulse';
  readonly currentYear = new Date().getFullYear();
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  layoutService = inject(LayoutService);

  logout() {
    this.authService.logout();
  }
}
