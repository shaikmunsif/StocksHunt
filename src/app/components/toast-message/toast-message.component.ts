import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-toast-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (message(); as msg) {
      @if (msg.message) {
      <div
        class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-slide-up"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div
          class="rounded-lg p-4 shadow-lg border-2"
          [class.bg-green-50]="msg.type === 'success'"
          [class.border-green-400]="msg.type === 'success'"
          [class.bg-red-50]="msg.type === 'error'"
          [class.border-red-400]="msg.type === 'error'"
          [class.dark:bg-green-900]="msg.type === 'success'"
          [class.dark:border-green-600]="msg.type === 'success'"
          [class.dark:bg-red-900]="msg.type === 'error'"
          [class.dark:border-red-600]="msg.type === 'error'"
        >
          <div class="flex items-center">
            <div class="flex-shrink-0">
              @if (msg.type === 'success') {
              <svg
                class="h-6 w-6 text-green-500 dark:text-green-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              } @else {
              <svg
                class="h-6 w-6 text-red-500 dark:text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              }
            </div>
            <div class="ml-3 flex-1">
              <p
                class="text-sm font-semibold"
                [class.text-green-800]="msg.type === 'success'"
                [class.text-red-800]="msg.type === 'error'"
                [class.dark:text-green-100]="msg.type === 'success'"
                [class.dark:text-red-100]="msg.type === 'error'"
              >
                {{ msg.message }}
              </p>
            </div>
          </div>
        </div>
      </div>
      }
    }
  `,
})
export class ToastMessageComponent {
  message = input<ToastMessage | null>(null);
}
