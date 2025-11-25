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

    reset() {
      patchState(store, initialState);
    },
  }))
);
