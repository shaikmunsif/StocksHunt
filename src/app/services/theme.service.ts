import { Injectable, signal, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'theme';

  readonly isDark = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Check localStorage first
    const storedTheme = localStorage.getItem(this.storageKey);
    if (storedTheme) {
      this.isDark.set(storedTheme === 'dark');
      this.updateDocumentClass();
      return;
    }

    // Fall back to system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.isDark.set(prefersDark);
    this.updateDocumentClass();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.storageKey)) {
        this.isDark.set(e.matches);
        this.updateDocumentClass();
      }
    });
  }

  toggleTheme(): void {
    this.isDark.update((current) => !current);
    localStorage.setItem(this.storageKey, this.isDark() ? 'dark' : 'light');
    this.updateDocumentClass();
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.isDark.set(theme === 'dark');
    localStorage.setItem(this.storageKey, theme);
    this.updateDocumentClass();
  }

  private updateDocumentClass(): void {
    const htmlElement = this.document.documentElement;

    if (this.isDark()) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }
}
