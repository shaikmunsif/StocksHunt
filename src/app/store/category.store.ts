import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Category } from '../interfaces/stock-data.interface';

type CategoryState = {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
};

const initialState: CategoryState = {
  categories: [],
  isLoading: false,
  error: null,
};

export const CategoryStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasCategories: computed(() => store.categories().length > 0),
    categoryNames: computed(() => store.categories().map((c) => c.name)),
    categoriesCount: computed(() => store.categories().length),
  })),
  withMethods((store) => ({
    setCategories(categories: Category[]) {
      patchState(store, { categories, error: null });
    },
    addCategory(category: Category) {
      const categories = [...store.categories(), category];
      patchState(store, { categories });
    },
    updateCategory(id: number, updates: Partial<Category>) {
      const categories = store.categories().map((cat) =>
        cat.id === id ? { ...cat, ...updates } : cat
      );
      patchState(store, { categories });
    },
    removeCategory(id: number) {
      const categories = store.categories().filter((cat) => cat.id !== id);
      patchState(store, { categories });
    },
    setLoading(isLoading: boolean) {
      patchState(store, { isLoading });
    },
    setError(error: string | null) {
      patchState(store, { error, isLoading: false });
    },
    clearCategories() {
      patchState(store, initialState);
    },
  }))
);
