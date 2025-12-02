import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  private readonly sidebarCollapsed = signal(false);

  isSidebarCollapsed(): boolean {
    return this.sidebarCollapsed();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
  }
}
