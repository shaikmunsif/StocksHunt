import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 })),
      ]),
      transition(':leave', [animate('200ms ease-out', style({ opacity: 0 }))]),
    ]),
  ],
})
export class SidebarComponent implements OnInit {
  isMobileMenuOpen = false;
  private touchStartX = 0;
  private touchStartY = 0;
  menuItems = [
    {
      title: 'Add Stock Data',
      icon: 'M12 4v16m8-8H4',
      route: '/manage-data',
      isActive: false,
    },
    {
      title: 'Gainers - Date Wise',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      route: '/analysis/date-wise',
      isActive: false,
    },
    {
      title: 'Gainers - Threshold',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      route: '/analysis/threshold',
      isActive: false,
    },
  ];

  constructor(
    public authService: AuthService,
    public layoutService: LayoutService,
    private router: Router
  ) {}

  get currentUser(): { email: string; username: string } | null {
    return this.authService.currentUser();
  }

  get isCollapsed(): boolean {
    return this.layoutService.isSidebarCollapsed();
  }

  ngOnInit(): void {
    this.updateActiveStates();
  }

  toggleSidebar(): void {
    this.layoutService.toggleSidebar();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Prevent body scroll when menu is open
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  onMobileLinkClick(): void {
    // Close mobile menu when a link is clicked
    if (window.innerWidth < 1024) {
      this.closeMobileMenu();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    // Close mobile menu on resize to desktop
    if (window.innerWidth >= 1024 && this.isMobileMenuOpen) {
      this.closeMobileMenu();
    }
  }

  updateActiveStates(): void {
    const currentRoute = window.location.pathname;
    this.menuItems.forEach((item) => {
      item.isActive = currentRoute === item.route;
    });
  }

  getMenuItemsForUserType(): any[] {
    return this.menuItems;
  }

  logout(): void {
    this.closeMobileMenu();
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        // Navigate to login even on error
        this.router.navigate(['/login']);
      },
    });
  }
}
