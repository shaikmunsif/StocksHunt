import {
  Component,
  ComponentRef,
  Type,
  ViewChild,
  ViewContainerRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
    <div
      class="fixed inset-0 z-50 overflow-y-auto mobile-dialog-wrapper"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="flex items-end justify-center min-h-screen pt-0 px-0 pb-0 text-center sm:pt-4 sm:px-4 sm:pb-20 sm:block sm:p-0"
      >
        <!-- Background overlay -->
        <div
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
          aria-hidden="true"
          (click)="close()"
        ></div>

        <!-- Center modal (Desktop) / Bottom Sheet (Mobile) -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"
          >&#8203;</span
        >

        <div
          class="relative inline-block w-full align-bottom bg-white dark:bg-gray-800 text-left overflow-hidden shadow-xl transform transition-all
                 max-h-[90vh] rounded-t-2xl sm:rounded-lg
                 sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full
                 mobile-dialog-content"
        >
          <!-- Mobile Drag Handle -->
          <div class="sm:hidden flex justify-center pt-3 pb-2">
            <div class="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>

          <!-- Close button -->
          <div class="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
            <button
              type="button"
              class="bg-white dark:bg-gray-800 rounded-full p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md"
              (click)="close()"
            >
              <span class="sr-only">Close</span>
              <svg
                class="h-5 w-5 sm:h-6 sm:w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <!-- Dynamic Content -->
          <div
            class="px-4 pt-2 pb-4 sm:px-6 sm:pt-5 sm:pb-4 overflow-y-auto max-h-[calc(90vh-60px)]"
          >
            <ng-template #contentHost></ng-template>
          </div>
        </div>
      </div>
    </div>
    }
  `,
  styles: [
    `
      .mobile-dialog-wrapper {
        @media (max-width: 639px) {
          background: transparent;
        }
      }

      .mobile-dialog-content {
        @media (max-width: 639px) {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
        }
        to {
          transform: translateY(0);
        }
      }

      /* Touch optimization */
      @media (hover: none) and (pointer: coarse) {
        .mobile-dialog-content {
          -webkit-tap-highlight-color: transparent;
          touch-action: pan-y;
        }
      }
    `,
  ],
})
export class DialogComponent {
  @ViewChild('contentHost', { read: ViewContainerRef }) contentHost!: ViewContainerRef;

  readonly isOpen = signal(false);
  private componentRef?: ComponentRef<any>;

  open<T>(component: Type<T>, data?: any): ComponentRef<T> {
    this.isOpen.set(true);

    // Wait for view to update so contentHost is available
    setTimeout(() => {
      this.contentHost.clear();
      this.componentRef = this.contentHost.createComponent(component);

      if (data && this.componentRef.instance) {
        Object.assign(this.componentRef.instance, data);
      }
    });

    return this.componentRef as ComponentRef<T>;
  }

  readonly close = () => {
    this.isOpen.set(false);
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  };
}
