import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '../dialog/dialog.service';
import { DatabaseService } from '../../services/database.service';
import { ToastMessageComponent, ToastMessage } from '../toast-message/toast-message.component';

@Component({
  selector: 'app-comment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastMessageComponent],
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
    <app-toast-message [message]="saveMessage()"></app-toast-message>

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
export class CommentModalComponent implements OnInit, OnDestroy {
  // Inputs
  companyId!: string;
  companyName!: string;
  tickerSymbol!: string;
  comment: string = '';
  onSave!: (update: { companyId: string; tickerSymbol: string; comments: string }) => void;

  commentText: string = '';
  isSaving = signal(false);
  saveMessage = signal<ToastMessage | null>(null);

  private readonly AUTO_HIDE_DURATION = 3000;
  private messageTimeout?: number;
  private dialogService = inject(DialogService);
  private databaseService = inject(DatabaseService);

  ngOnInit() {
    this.commentText = this.comment || '';
  }

  ngOnDestroy() {
    if (this.messageTimeout) {
      clearTimeout(this.messageTimeout);
    }
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

      // Auto-hide message
      if (this.messageTimeout) {
        clearTimeout(this.messageTimeout);
      }
      this.messageTimeout = window.setTimeout(() => {
        this.saveMessage.set(null);
      }, this.AUTO_HIDE_DURATION);

      // DO NOT close the dialog - keep it open for further edits
    } catch (error) {
      console.error('Error saving comment:', error);

      // Show error message
      this.saveMessage.set({
        type: 'error',
        message: 'Failed to save comment. Please try again.',
      });

      // Auto-hide error message
      if (this.messageTimeout) {
        clearTimeout(this.messageTimeout);
      }
      this.messageTimeout = window.setTimeout(() => {
        this.saveMessage.set(null);
      }, this.AUTO_HIDE_DURATION);
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    this.dialogService.close();
  }
}
