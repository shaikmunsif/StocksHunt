import { Component, inject } from '@angular/core';
import { IconsComponent } from '../svg/icons';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  imports: [IconsComponent],
  template: `
    <button
      type="button"
      (click)="themeService.toggleTheme()"
      class="theme-toggle"
      [class.theme-toggle--dark]="themeService.isDark()"
      aria-label="Toggle theme"
    >
      <span class="theme-toggle__track">
        <span class="theme-toggle__icon theme-toggle__icon--sun">
          <app-icon iconName="sun" width="16" height="16"></app-icon>
        </span>
        <span class="theme-toggle__icon theme-toggle__icon--moon">
          <app-icon iconName="moon" width="16" height="16"></app-icon>
        </span>
        <span class="theme-toggle__knob"></span>
      </span>
    </button>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .theme-toggle {
        position: relative;
        width: 56px;
        height: 32px;
        padding: 0;
        border: none;
        border-radius: 9999px;
        background: linear-gradient(135deg, rgba(130, 87, 230, 0.6), rgba(9, 9, 121, 0.65));
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        box-shadow: 0 8px 18px rgba(79, 70, 229, 0.22);
      }

      .theme-toggle:hover {
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 12px 22px rgba(79, 70, 229, 0.3);
      }

      .theme-toggle:active {
        transform: translateY(0);
      }

      .theme-toggle:focus-visible {
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.45);
      }

      .theme-toggle__track {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        transition: background 0.3s ease;
      }

      .theme-toggle--dark .theme-toggle__track {
        background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%);
      }

      .theme-toggle__knob {
        position: absolute;
        top: 4px;
        left: 4px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%);
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.25);
        transition: transform 0.3s ease;
      }

      .theme-toggle--dark .theme-toggle__knob {
        transform: translateX(24px);
        background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
      }

      .theme-toggle__icon {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        opacity: 0.9;
        transition: opacity 0.3s ease;
      }

      .theme-toggle__icon--sun {
        left: 9px;
        color: #fbbf24;
      }

      .theme-toggle__icon--moon {
        right: 9px;
        color: #bfdbfe;
      }

      .theme-toggle--dark .theme-toggle__icon--sun {
        opacity: 0.4;
      }

      .theme-toggle--dark .theme-toggle__icon--moon {
        opacity: 1;
      }

      .theme-toggle:not(.theme-toggle--dark) .theme-toggle__icon--moon {
        opacity: 0.4;
      }
    `,
  ],
})
export class ThemeToggleComponent {
  readonly themeService = inject(ThemeService);
}
