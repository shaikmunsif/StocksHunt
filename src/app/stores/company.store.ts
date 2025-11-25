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
    updateComment(id: string, comments: string) {
      const current = store.entities();
      patchState(store, {
        entities: {
          ...current,
          [id]: {
            ...(current[id] ?? { id, ticker_symbol: id, comments: '', categoryName: null }),
            comments: (comments ?? '').trim(),
          },
        },
      });
    },
    updateCategory(id: string, categoryName: string | null) {
      const current = store.entities();
      patchState(store, {
        entities: {
          ...current,
          [id]: {
            ...(current[id] ?? { id, ticker_symbol: id, comments: '', categoryName: null }),
            categoryName: categoryName ?? null,
          },
        },
      });
    },
  }))
);
