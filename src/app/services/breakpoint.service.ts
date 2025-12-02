import { Injectable, signal, effect, inject, DestroyRef } from '@angular/core';

export enum Breakpoint {
  Mobile = 'mobile', // < 640px
  Tablet = 'tablet', // 640px - 1023px
  Desktop = 'desktop', // >= 1024px
}

@Injectable({
  providedIn: 'root',
})
export class BreakpointService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly resizeHandler = this.handleResize.bind(this);
  private currentBreakpoint = signal<Breakpoint>(this.detectBreakpoint());
  readonly breakpoint = this.currentBreakpoint.asReadonly();

  // Convenience signals
  readonly isMobile = signal(false);
  readonly isTablet = signal(false);
  readonly isDesktop = signal(false);
  readonly isMobileOrTablet = signal(false);

  constructor() {
    // Initialize
    this.updateBreakpointSignals();

    // Listen to window resize with proper cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeHandler);

      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', this.resizeHandler);
      });
    }

    // Update dependent signals when breakpoint changes
    effect(() => {
      this.updateBreakpointSignals();
    });
  }

  private detectBreakpoint(): Breakpoint {
    if (typeof window === 'undefined') {
      return Breakpoint.Desktop;
    }

    const width = window.innerWidth;

    if (width < 640) {
      return Breakpoint.Mobile;
    } else if (width < 1024) {
      return Breakpoint.Tablet;
    } else {
      return Breakpoint.Desktop;
    }
  }

  private handleResize(): void {
    const newBreakpoint = this.detectBreakpoint();
    if (newBreakpoint !== this.currentBreakpoint()) {
      this.currentBreakpoint.set(newBreakpoint);
    }
  }

  private updateBreakpointSignals(): void {
    const bp = this.currentBreakpoint();
    this.isMobile.set(bp === Breakpoint.Mobile);
    this.isTablet.set(bp === Breakpoint.Tablet);
    this.isDesktop.set(bp === Breakpoint.Desktop);
    this.isMobileOrTablet.set(bp === Breakpoint.Mobile || bp === Breakpoint.Tablet);
  }
}
