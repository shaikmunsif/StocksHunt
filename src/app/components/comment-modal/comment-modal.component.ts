import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '../dialog/dialog.service';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-comment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sm:flex sm:items-start">
      <div
        class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10"
      >
        <svg
          class="h-6 w-6 text-indigo-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      </div>
      <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
        <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
          {{ comment ? 'Edit Comment' : 'Add Comment' }}
        </h3>
        <div class="mt-2">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add a note for {{ companyName }} ({{ tickerSymbol }}).
          </p>
          <textarea
            [(ngModel)]="commentText"
            rows="4"
            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm text-base border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-3 sm:py-2"
            placeholder="Enter your comment here..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Success/Error Message -->
    @if (saveMessage()) {
    <div
      class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-slide-up"
    >
      <div
        class="rounded-lg p-4 shadow-lg border-2"
        [class.bg-green-50]="saveMessage()?.type === 'success'"
        [class.border-green-400]="saveMessage()?.type === 'success'"
        [class.bg-red-50]="saveMessage()?.type === 'error'"
        [class.border-red-400]="saveMessage()?.type === 'error'"
        [class.dark:bg-green-900]="saveMessage()?.type === 'success'"
        [class.dark:border-green-600]="saveMessage()?.type === 'success'"
        [class.dark:bg-red-900]="saveMessage()?.type === 'error'"
        [class.dark:border-red-600]="saveMessage()?.type === 'error'"
      >
        <div class="flex items-center">
          <div class="flex-shrink-0">
            @if (saveMessage()?.type === 'success') {
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
              [class.text-green-800]="saveMessage()?.type === 'success'"
              [class.text-red-800]="saveMessage()?.type === 'error'"
              [class.dark:text-green-100]="saveMessage()?.type === 'success'"
              [class.dark:text-red-100]="saveMessage()?.type === 'error'"
            >
              {{ saveMessage()?.message }}
            </p>
          </div>
        </div>
      </div>
    </div>
    }

    <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <button
        type="button"
        (click)="save()"
        [disabled]="isSaving()"
        class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 sm:py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm min-h-[48px] sm:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        @if (isSaving()) {
        <svg
          class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Saving... } @else { Save }
      </button>
      <button
        type="button"
        (click)="cancel()"
        [disabled]="isSaving()"
        class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-3 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[48px] sm:min-h-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Cancel
      </button>
    </div>
  `,
})
export class CommentModalComponent {
  // Inputs
  companyId!: string;
  companyName!: string;
  tickerSymbol!: string;
  comment: string = '';
  onSave!: (update: { companyId: string; tickerSymbol: string; comments: string }) => void;

  commentText: string = '';
  isSaving = signal(false);
  saveMessage = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  private dialogService = inject(DialogService);
  private databaseService = inject(DatabaseService);

  ngOnInit() {
    this.commentText = this.comment || '';
  }

  async save() {
    if (this.isSaving()) return;

    if (!this.commentText.trim() && this.comment) {
      if (!confirm('Are you sure you want to erase this comment?')) {
        return;
      }
    }

    this.isSaving.set(true);
    this.saveMessage.set(null); // Clear previous messages

    try {
      await this.databaseService.updateCompanyComment(this.companyId, this.commentText);
      if (this.onSave)
        this.onSave({
          companyId: this.companyId,
          tickerSymbol: this.tickerSymbol,
          comments: this.commentText,
        });

      // Show success message
      this.saveMessage.set({
        type: 'success',
        message: 'Comment saved successfully!',
      });

      // Auto-hide message after 3 seconds
      setTimeout(() => {
        this.saveMessage.set(null);
      }, 3000);

      // DO NOT close the dialog - keep it open for further edits
    } catch (error) {
      console.error('Error saving comment:', error);

      // Show error message
      this.saveMessage.set({
        type: 'error',
        message: 'Failed to save comment. Please try again.',
      });

      // Auto-hide error message after 3 seconds
      setTimeout(() => {
        this.saveMessage.set(null);
      }, 3000);
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    this.dialogService.close();
  }
}
