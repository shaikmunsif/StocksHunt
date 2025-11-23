import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { CompanyWithMarketData, MarketDataResponse } from '../interfaces/stock-data.interface';

type StockState = {
  marketData: MarketDataResponse;
  availableDates: string[];
  isLoading: boolean;
  error: string | null;
};

const initialState: StockState = {
  marketData: { date: '', companies: [] },
  availableDates: [],
  isLoading: false,
  error: null,
};

export const StockStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasData: computed(() => store.marketData().companies.length > 0),
    companiesCount: computed(() => store.marketData().companies.length),
  })),
  withMethods((store) => ({
    setMarketData(marketData: MarketDataResponse) {
      patchState(store, { marketData, error: null });
    },
    setAvailableDates(dates: string[]) {
      patchState(store, { availableDates: dates });
    },
    setLoading(isLoading: boolean) {
      patchState(store, { isLoading });
    },
    setError(error: string | null) {
      patchState(store, { error, isLoading: false });
    },
    updateCompanyInMarketData(companyId: string, updates: Partial<CompanyWithMarketData>) {
      const currentData = store.marketData();
      const updatedCompanies = currentData.companies.map((company) =>
        company.id === companyId ? { ...company, ...updates } : company
      );
      patchState(store, {
        marketData: { ...currentData, companies: updatedCompanies },
      });
    },
    clearData() {
      patchState(store, initialState);
    },
  }))
);
