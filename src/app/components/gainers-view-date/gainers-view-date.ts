import { Component, OnInit, OnDestroy, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { BreakpointService } from '../../services/breakpoint.service';
import { MarketDataResponse, CompanyWithMarketData } from '../../interfaces/stock-data.interface';
import { DialogService } from '../dialog/dialog.service';
import { CommentModalComponent } from '../comment-modal/comment-modal.component';
import { EditCompanyModalComponent } from '../edit-company-modal/edit-company-modal.component';
import { ShimmerLoaderComponent } from '../shimmer-loader/shimmer-loader.component';
import { CompanyStore } from '../../stores/company.store';
import {
  formatPrice as formatPriceUtil,
  formatChange as formatChangeUtil,
  getChangeClass as getChangeClassUtil,
} from '../../utils/format.utils';

@Component({
  selector: 'app-gainers-view-date',
  imports: [FormsModule, DatePipe, ShimmerLoaderComponent],
  templateUrl: './gainers-view-date.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./gainers-view-date.scss'],
})
export class GainersViewDateComponent implements OnInit, OnDestroy {
  private readonly databaseService = inject(DatabaseService);
  private readonly dialogService = inject(DialogService);
  readonly breakpointService = inject(BreakpointService);
  private readonly companyStore = inject(CompanyStore);

  marketData = signal<MarketDataResponse | null>(null);
  isLoading = signal(false);
  loadingProgress = signal(0);
  error = signal<string | null>(null);
  selectedDate = signal('');
  selectedExchange = signal('NSE');
  availableDates = signal<string[]>([]);
  readonly exchanges = ['NSE', 'BSE'];
  maxDate = signal('');
  maxDateKey = computed(() => this.toDateKey(this.maxDate()));

  sortColumn = signal('occurrence_count');
  sortDirection = signal<'asc' | 'desc'>('desc');

  private progressInterval?: number;
  private currentRequestId = 0;

  getCategoryClass(categoryName?: string): string {
    const isAvoid = categoryName === 'Avoid';
    return isAvoid
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  }

  getRowClass(categoryName?: string): string {
    const isAvoid = categoryName === 'Avoid';
    return isAvoid
      ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-800/30'
      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
  }

  ngOnInit(): void {
    this.initializeDefaults();
    this.loadAvailableDates();
  }

  private initializeDefaults(): void {
    const todayString = this.formatDate(new Date());
    this.maxDate.set(todayString);
    this.selectedDate.set(todayString);
  }

  async loadAvailableDates(): Promise<void> {
    try {
      const dates = await this.databaseService.getAvailableDates();
      const filtered = dates
        .filter((date) => !this.isFutureDate(date))
        .sort((a, b) => this.toDateKey(b) - this.toDateKey(a));
      this.availableDates.set(filtered);
      if (filtered.length > 0 && !filtered.includes(this.selectedDate())) {
        this.selectedDate.set(filtered[0]);
        this.maxDate.set(filtered[0]);
      }
      await this.loadMarketData();
    } catch (error) {
      console.error('Error loading available dates:', error);
      this.error.set('Unable to load the list of available dates. Please try again later.');
    }
  }

  async loadMarketData(): Promise<void> {
    if (!this.selectedDate()) return;

    if (this.isFutureDate(this.selectedDate())) {
      this.selectedDate.set(this.maxDate());
    }

    this.isLoading.set(true);
    this.loadingProgress.set(0);
    this.error.set(null);

    try {
      const requestId = ++this.currentRequestId;
      this.loadingProgress.set(5);

      if (this.progressInterval) {
        clearInterval(this.progressInterval);
      }
      this.progressInterval = window.setInterval(() => {
        if (this.loadingProgress() < 18) {
          this.loadingProgress.update(p => p + 1);
        }
      }, 50);

      const data = await this.databaseService.getMarketDataByDate(this.selectedDate());
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = undefined;
      }
      this.loadingProgress.set(20);

      if (data.companies) {
        data.companies = data.companies.filter(
          (company) => company.exchange?.code === this.selectedExchange()
        );
        this.loadingProgress.set(22);

        this.companyStore.upsertMany(
          data.companies.map((c) => ({
            id: c.id,
            ticker_symbol: c.ticker_symbol,
            comments: c.comments || '',
            category: c.category ? { name: c.category.name } : null,
          }))
        );
        this.loadingProgress.set(25);
      }

      if (requestId !== this.currentRequestId) {
        return;
      }

      this.loadingProgress.set(90);

      if (data.companies) {
        this.sortDataArray(data.companies);
      }
      this.marketData.set(data);
      this.loadingProgress.set(100);
    } catch (error) {
      console.error('Error loading market data:', error);
      this.error.set('Failed to load market data. Please try again.');
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = undefined;
      }
    } finally {
      this.isLoading.set(false);
      this.loadingProgress.set(0);
    }
  }

  ngOnDestroy() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  sortDataArray(companies: CompanyWithMarketData[]): void {
    companies.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (this.sortColumn()) {
        case 'ticker_symbol':
          aValue = a.ticker_symbol;
          bValue = b.ticker_symbol;
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'current_price':
          aValue = a.market_data?.current_price || 0;
          bValue = b.market_data?.current_price || 0;
          break;
        case 'previous_close':
          aValue = a.market_data?.previous_close || 0;
          bValue = b.market_data?.previous_close || 0;
          break;
        case 'percentage_change':
          aValue = a.market_data?.percentage_change || 0;
          bValue = b.market_data?.percentage_change || 0;
          break;
        case 'category':
          aValue = a.category?.name || '';
          bValue = b.category?.name || '';
          break;
        case 'occurrence_count':
          aValue = this.getOccurrenceCount(a);
          bValue = this.getOccurrenceCount(b);
          break;
        default:
          aValue = a.ticker_symbol;
          bValue = b.ticker_symbol;
      }

      let comparison: number;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        const numA = Number.isFinite(aValue) ? (aValue as number) : 0;
        const numB = Number.isFinite(bValue) ? (bValue as number) : 0;
        comparison = numA - numB;
      }

      comparison = this.sortDirection() === 'asc' ? comparison : -comparison;

      if (comparison === 0 && this.sortColumn() === 'occurrence_count') {
        const aChange = a.market_data?.percentage_change || 0;
        const bChange = b.market_data?.percentage_change || 0;
        return bChange - aChange;
      }

      return comparison;
    });
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(this.getDefaultSortDirection(column));
    }

    const data = this.marketData();
    if (data?.companies) {
      this.sortDataArray(data.companies);
      this.marketData.set({ ...data });
    }
  }

  private getDefaultSortDirection(column: string): 'asc' | 'desc' {
    switch (column) {
      case 'ticker_symbol':
      case 'name':
      case 'category':
        return 'asc';
      case 'current_price':
      case 'previous_close':
      case 'percentage_change':
      case 'occurrence_count':
        return 'desc';
      default:
        return 'asc';
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) {
      return 'M7 11l5-5m0 0l5 5m-5-5v12';
    }
    return this.sortDirection() === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7';
  }

  onDateChange(): void {
    if (this.isFutureDate(this.selectedDate())) {
      this.selectedDate.set(this.maxDate());
    }
    this.loadMarketData();
  }

  onExchangeChange(): void {
    this.loadMarketData();
  }

  formatPrice(price?: number): string {
    return formatPriceUtil(price);
  }

  formatChange(change?: number): string {
    return formatChangeUtil(change);
  }

  getChangeClass(change?: number): string {
    return getChangeClassUtil(change);
  }

  getComment(company: CompanyWithMarketData): string {
    if (company.comments && company.comments.trim()) {
      return company.comments.trim();
    }
    return '-';
  }

  async exportToCSV(): Promise<void> {
    const companies = this.marketData()?.companies;
    if (!companies || companies.length === 0) {
      alert('No data available to export');
      return;
    }

    const headers = [
      'Ticker Symbol',
      'Company Name',
      'Current Price',
      'Previous Close',
      'Change %',
      'Category',
      'Occurrences',
      'Comments',
    ];
    const rows = companies.map((company: CompanyWithMarketData) => [
      company.ticker_symbol,
      company.name || 'N/A',
      this.formatPrice(company.market_data?.current_price),
      this.formatPrice(company.market_data?.previous_close),
      this.formatChange(company.market_data?.percentage_change),
      company.category?.name || 'N/A',
      this.getOccurrenceCount(company).toString(),
      this.getComment(company),
    ]);

    const csvContent = [headers, ...rows]
      .map((row: string[]) => row.map((cell: string) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gainers_datewise_${this.selectedDate()}_${this.selectedExchange()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  async refreshData(): Promise<void> {
    await this.loadMarketData();
  }

  trackByFn(index: number, item: CompanyWithMarketData): string {
    return item.ticker_symbol;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDateKey(dateString: string): number {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) {
      return 0;
    }
    return year * 10000 + month * 100 + day;
  }

  private isFutureDate(dateString: string): boolean {
    const dateKey = this.toDateKey(dateString);
    return dateKey > this.maxDateKey();
  }

  getOccurrenceCount(company: CompanyWithMarketData): number {
    if (company.occurrence_count === undefined) {
      return 0;
    }
    return company.occurrence_count;
  }

  toggleExpanded(company: CompanyWithMarketData): void {
    company.expanded = !company.expanded;
  }

  addComment(company: CompanyWithMarketData): void {
    this.dialogService.open(CommentModalComponent, {
      companyId: company.id,
      companyName: company.name,
      tickerSymbol: company.ticker_symbol,
      comment: '',
      onSave: (update: { companyId: string; tickerSymbol: string; comments: string }) => {
        this.marketData.update(m => {
          if (!m) return m;
          const idx = m.companies.findIndex(
            (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
          );
          if (idx >= 0) {
            const updated = {
              ...m.companies[idx],
              comments: update.comments?.trim() || '',
            } as CompanyWithMarketData;
            return { ...m, companies: [...m.companies.slice(0, idx), updated, ...m.companies.slice(idx + 1)] };
          }
          return m;
        });
        this.companyStore.updateComment(update.companyId, update.comments ?? '');
      },
    });
  }

  editComment(company: CompanyWithMarketData): void {
    this.dialogService.open(CommentModalComponent, {
      companyId: company.id,
      companyName: company.name,
      tickerSymbol: company.ticker_symbol,
      comment: company.comments || '',
      onSave: (update: { companyId: string; tickerSymbol: string; comments: string }) => {
        this.marketData.update(m => {
          if (!m) return m;
          const idx = m.companies.findIndex(
            (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
          );
          if (idx >= 0) {
            const updated = {
              ...m.companies[idx],
              comments: update.comments?.trim() || '',
            } as CompanyWithMarketData;
            return { ...m, companies: [...m.companies.slice(0, idx), updated, ...m.companies.slice(idx + 1)] };
          }
          return m;
        });
        this.companyStore.updateComment(update.companyId, update.comments ?? '');
      },
    });
  }

  editRow(company: CompanyWithMarketData, index: number): void {
    const occurrenceCounts = new Map<string, number>();
    this.marketData()?.companies?.forEach((c) => {
      occurrenceCounts.set(c.ticker_symbol, c.occurrence_count || 0);
    });

    this.dialogService.open(EditCompanyModalComponent, {
      companyId: company.id,
      companyName: company.name,
      tickerSymbol: company.ticker_symbol,
      currentPrice: this.formatPrice(company.market_data?.current_price),
      percentageChange: this.formatChange(company.market_data?.percentage_change),
      changeClass: this.getChangeClass(company.market_data?.percentage_change),
      occurrenceCount: this.getOccurrenceCount(company),
      category: company.category?.name || '',
      comment: company.comments || '',
      onSave: (update: {
        companyId: string;
        tickerSymbol: string;
        categoryName: string | null;
        comments: string;
      }) => {
        this.marketData.update(m => {
          if (!m) return m;
          const idx = m.companies.findIndex(
            (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
          );
          if (idx >= 0) {
            const current = m.companies[idx];
            const updated: CompanyWithMarketData = {
              ...current,
              comments: update.comments?.trim() || '',
              category:
                update.categoryName !== null
                  ? current.category
                    ? { ...current.category, name: update.categoryName }
                    : undefined
                  : undefined,
            };
            return { ...m, companies: [...m.companies.slice(0, idx), updated, ...m.companies.slice(idx + 1)] };
          }
          return m;
        });
        this.companyStore.updateComment(update.companyId, update.comments ?? '');
        this.companyStore.updateCategory(update.companyId, update.categoryName);
      },
      companiesList: this.marketData()?.companies || [],
      currentIndex: index,
      occurrenceCounts: occurrenceCounts,
    });
  }
}
