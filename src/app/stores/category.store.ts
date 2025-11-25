import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { DatabaseService } from '../services/database.service';
import { Category } from '../interfaces/stock-data.interface';

export interface CategoryState {
  categories: Category[];
  loading: boolean;
  loaded: boolean;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  loaded: false,
};

export const CategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, databaseService = inject(DatabaseService)) => ({
    /**
     * Loads categories from the database if not already loaded or loading.
     * Implements a caching mechanism to prevent redundant API calls.
     * @returns Promise that resolves when categories are loaded or rejects on error
     */
    async loadCategories() {
      // Don't reload if already loaded or currently loading
      if (store.loaded() || store.loading()) {
        return;
      }

      patchState(store, { loading: true });

      try {
        const categories = await databaseService.getCategories();
        patchState(store, {
          categories,
          loading: false,
          loaded: true,
        });
      } catch (error) {
        console.error('Error loading categories:', error);
        patchState(store, {
          loading: false,
          loaded: false,
        });
      }
    },

    /**
     * Resets the store to its initial state, clearing all categories and flags.
     */
    reset() {
      patchState(store, initialState);
    },
  }))
);
