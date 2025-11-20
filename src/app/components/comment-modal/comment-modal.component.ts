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
    <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
      <button
        type="button"
        (click)="save()"
        class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 sm:py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm min-h-[48px] sm:min-h-0"
      >
        Save
      </button>
      <button
        type="button"
        (click)="cancel()"
        class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-3 sm:py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 min-h-[48px] sm:min-h-0"
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
  onSave!: () => void;

  commentText: string = '';

  private dialogService = inject(DialogService);
  private databaseService = inject(DatabaseService);

  ngOnInit() {
    this.commentText = this.comment || '';
  }

  async save() {
    if (!this.commentText.trim() && this.comment) {
      if (!confirm('Are you sure you want to erase this comment?')) {
        return;
      }
    }

    try {
      await this.databaseService.updateCompanyComment(this.companyId, this.commentText);
      if (this.onSave) this.onSave();
      this.dialogService.close();
    } catch (error) {
      console.error('Error saving comment:', error);
      alert('Failed to save comment');
    }
  }

  cancel() {
    this.dialogService.close();
  }
}
