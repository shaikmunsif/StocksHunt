import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';

export interface CompanyEntityState {
  entities: Record<
    string,
    {
      id: string;
      ticker_symbol: string;
      comments: string;
      categoryName: string | null;
    }
  >;
}

const initialState: CompanyEntityState = {
  entities: {},
};

type UpsertInput = {
  id: string;
  ticker_symbol: string;
  comments?: string | null;
  category?: { name?: string | null } | null | undefined;
};

export const CompanyStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    /**
     * Upserts multiple companies into the store, replacing existing entries.
     * @param items - Array of company data to upsert
     */
    upsertMany(items: UpsertInput[]) {
      const next = { ...store.entities() };
      for (const c of items) {
        if (!c?.id) continue;
        next[c.id] = {
          id: c.id,
          ticker_symbol: c.ticker_symbol,
          comments: (c.comments ?? '').trim(),
          categoryName: c.category?.name ?? null,
        };
      }
      patchState(store, { entities: next });
    },
    /**
     * Updates the comment for a specific company.
     * Only updates if the company exists in the store.
     * @param id - Company ID
     * @param comments - New comment text (will be trimmed)
     */
    updateComment(id: string, comments: string) {
      const current = store.entities();
      if (!current[id]) {
        console.warn(`Company ${id} not found in store. Skipping comment update.`);
        return;
      }
      patchState(store, {
        entities: {
          ...current,
          [id]: {
            ...current[id],
            comments: (comments ?? '').trim(),
          },
        },
      });
    },
    /**
     * Updates the category for a specific company.
     * Only updates if the company exists in the store.
     * @param id - Company ID
     * @param categoryName - New category name or null to clear
     */
    updateCategory(id: string, categoryName: string | null) {
      const current = store.entities();
      if (!current[id]) {
        console.warn(`Company ${id} not found in store. Skipping category update.`);
        return;
      }
      patchState(store, {
        entities: {
          ...current,
          [id]: {
            ...current[id],
            categoryName: categoryName ?? null,
          },
        },
      });
    },
  }))
);
