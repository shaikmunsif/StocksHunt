import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { AuthService } from '../../services/auth.service';
import { LayoutService } from '../../services/layout.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  host: {
    '(window:resize)': 'onResize()',
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd($event)',
  },
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
export class SidebarComponent implements OnInit, OnDestroy {
  isMobileMenuOpen = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private routerSubscription?: Subscription;
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
    {
      title: 'Settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      route: '/settings',
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

    // Subscribe to router events to update active states on navigation
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveStates();
      });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
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

  // Touch event handlers for mobile swipe
  onTouchStart(event: TouchEvent): void {
    if (window.innerWidth >= 1024) return; // Only on mobile

    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    if (window.innerWidth >= 1024) return; // Only on mobile

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    // Check if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && this.touchStartX < 50) {
        // Swipe right from left edge - open menu
        this.isMobileMenuOpen = true;
        document.body.style.overflow = 'hidden';
      } else if (deltaX < 0 && this.isMobileMenuOpen) {
        // Swipe left when menu is open - close menu
        this.closeMobileMenu();
      }
    }
  }
}
