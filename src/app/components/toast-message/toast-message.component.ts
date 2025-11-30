import { Component, input } from '@angular/core';
import { IconsComponent } from '../svg';

export interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-toast-message',
  imports: [IconsComponent],
  template: `
    @if (message()) {
    <div
      class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-slide-up"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        class="rounded-lg p-4 shadow-lg border-2"
        [class.bg-green-50]="message()!.type === 'success'"
        [class.border-green-400]="message()!.type === 'success'"
        [class.bg-red-50]="message()!.type === 'error'"
        [class.border-red-400]="message()!.type === 'error'"
        [class.dark:bg-green-900]="message()!.type === 'success'"
        [class.dark:border-green-600]="message()!.type === 'success'"
        [class.dark:bg-red-900]="message()!.type === 'error'"
        [class.dark:border-red-600]="message()!.type === 'error'"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <app-icon
              [iconName]="message()!.type === 'success' ? 'success' : 'error-circle'"
              width="24"
              height="24"
              [className]="
                message()!.type === 'success'
                  ? 'text-green-500 dark:text-green-400'
                  : 'text-red-500 dark:text-red-400'
              "
            />
          </div>
          <div class="ml-3 flex-1">
            <p
              class="text-sm font-semibold"
              [class.text-green-800]="message()!.type === 'success'"
              [class.text-red-800]="message()!.type === 'error'"
              [class.dark:text-green-100]="message()!.type === 'success'"
              [class.dark:text-red-100]="message()!.type === 'error'"
            >
              {{ message()!.message }}
            </p>
          </div>
        </div>
      </div>
    </div>
    }
  `,
})
export class ToastMessageComponent {
  readonly message = input<ToastMessage | null>(null);
}
