import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
  styleUrls: ['./gainers-view-date.scss'],
})
export class GainersViewDateComponent implements OnInit, OnDestroy {
  private readonly databaseService = inject(DatabaseService);
  private readonly dialogService = inject(DialogService);
  readonly breakpointService = inject(BreakpointService);
  private readonly companyStore = inject(CompanyStore);

  marketData: MarketDataResponse | null = null;
  isLoading = false;
  loadingProgress = 0;
  error: string | null = null;
  selectedDate: string = '';
  selectedExchange: string = 'NSE';
  availableDates: string[] = [];
  exchanges = ['NSE', 'BSE'];
  maxDate = '';
  private maxDateKey = 0;

  // Sorting properties - default to occurrence_count descending
  sortColumn: string = 'occurrence_count';
  sortDirection: 'asc' | 'desc' = 'desc';

  private progressInterval?: number;
  private currentRequestId = 0;

  ngOnInit(): void {
    this.initializeDefaults();
    this.loadAvailableDates();
  }

  private initializeDefaults(): void {
    const todayString = this.formatDate(new Date());
    this.maxDate = todayString;
    this.maxDateKey = this.toDateKey(todayString);
    this.selectedDate = todayString;
  }

  async loadAvailableDates(): Promise<void> {
    try {
      const dates = await this.databaseService.getAvailableDates();
      this.availableDates = dates
        .filter((date) => !this.isFutureDate(date))
        .sort((a, b) => this.toDateKey(b) - this.toDateKey(a));
      if (this.availableDates.length > 0 && !this.availableDates.includes(this.selectedDate)) {
        this.selectedDate = this.availableDates[0];
        this.maxDate = this.availableDates[0];
        this.maxDateKey = this.toDateKey(this.availableDates[0]);
      }
      // Load initial data
      await this.loadMarketData();
    } catch (error) {
      console.error('Error loading available dates:', error);
      this.error = 'Unable to load the list of available dates. Please try again later.';
    }
  }

  async loadMarketData(): Promise<void> {
    if (!this.selectedDate) return;

    if (this.isFutureDate(this.selectedDate)) {
      this.selectedDate = this.maxDate;
    }

    this.isLoading = true;
    this.loadingProgress = 0;
    this.error = null;

    try {
      const requestId = ++this.currentRequestId;
      // Step 1: Fetch market data (0-20%) with simulated incremental progress
      this.loadingProgress = 5;

      // Simulate realistic loading progress during API call
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
      }
      this.progressInterval = window.setInterval(() => {
        if (this.loadingProgress < 18) {
          this.loadingProgress += 1;
        }
      }, 50); // Increment every 50ms

      const data = await this.databaseService.getMarketDataByDate(this.selectedDate);
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = undefined;
      }
      this.loadingProgress = 20;

      // Step 2: Filter and process data (20-25%)
      if (data.companies) {
        data.companies = data.companies.filter(
          (company) => company.exchange?.code === this.selectedExchange
        );
        this.loadingProgress = 22;

        // Hydrate store with latest company shells
        this.companyStore.upsertMany(
          data.companies.map((c) => ({
            id: c.id,
            ticker_symbol: c.ticker_symbol,
            comments: c.comments || '',
            category: c.category ? { name: c.category.name } : null,
          }))
        );
        this.loadingProgress = 25;
      }

      // If a newer request started, abort applying results
      if (requestId !== this.currentRequestId) {
        return;
      }

      this.marketData = data;

      // Step 3: Apply sorting (occurrence counts already included from database view)
      this.loadingProgress = 90;

      if (data.companies) {
        this.sortData(data.companies);
      }
      this.loadingProgress = 100;
    } catch (error) {
      console.error('Error loading market data:', error);
      this.error = 'Failed to load market data. Please try again.';
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
        this.progressInterval = undefined;
      }
    } finally {
      this.isLoading = false;
      this.loadingProgress = 0;
    }
  }

  ngOnDestroy() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
  }

  sortData(companies: CompanyWithMarketData[]): void {
    companies.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (this.sortColumn) {
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

      // Apply sort direction
      comparison = this.sortDirection === 'asc' ? comparison : -comparison;

      // If values are equal and we're sorting by occurrence_count, use percentage_change as tiebreaker
      if (comparison === 0 && this.sortColumn === 'occurrence_count') {
        const aChange = a.market_data?.percentage_change || 0;
        const bChange = b.market_data?.percentage_change || 0;
        // Tiebreaker: higher percentage change comes first (descending)
        return bChange - aChange;
      }

      return comparison;
    });
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = this.getDefaultSortDirection(column);
    }

    if (this.marketData?.companies) {
      this.sortData(this.marketData.companies);
    }
  }

  /**
   * Returns the default sort direction for a column based on user expectations.
   * Numeric columns default to descending (highest first), text columns to ascending (A-Z).
   */
  private getDefaultSortDirection(column: string): 'asc' | 'desc' {
    switch (column) {
      case 'ticker_symbol':
      case 'name':
      case 'category':
        return 'asc'; // Alphabetical columns: A-Z first
      case 'current_price':
      case 'previous_close':
      case 'percentage_change':
      case 'occurrence_count':
        return 'desc'; // Numeric columns: highest first
      default:
        return 'asc';
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'M7 11l5-5m0 0l5 5m-5-5v12';
    }
    return this.sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7';
  }

  onDateChange(): void {
    if (this.isFutureDate(this.selectedDate)) {
      this.selectedDate = this.maxDate;
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
    // Only display comments if they actually exist in the data
    if (company.comments && company.comments.trim()) {
      return company.comments.trim();
    }
    return '-';
  }

  async exportToCSV(): Promise<void> {
    if (!this.marketData?.companies || this.marketData.companies.length === 0) {
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
    const rows = this.marketData.companies.map((company: CompanyWithMarketData) => [
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
    a.download = `gainers_datewise_${this.selectedDate}_${this.selectedExchange}.csv`;
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
    return dateKey > this.maxDateKey;
  }

  getOccurrenceCount(company: CompanyWithMarketData): number {
    if (company.occurrence_count === undefined) {
      console.warn(
        `occurrence_count is missing for company: ${
          company.ticker_symbol || company.id || '[unknown]'
        }`,
        company
      );
      return 0;
    }
    return company.occurrence_count;
  }

  /**
   * Toggles the expanded state of a company's comment section.
   * Using a method ensures proper change detection.
   */
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
        const list = this.marketData?.companies;
        if (!list) return;
        const idx = list.findIndex(
          (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
        );
        if (idx >= 0) {
          const updated = {
            ...list[idx],
            comments: update.comments?.trim() || '',
          } as CompanyWithMarketData;
          this.marketData = {
            ...this.marketData!,
            companies: [...list.slice(0, idx), updated, ...list.slice(idx + 1)],
          };
        }

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
        const list = this.marketData?.companies;
        if (!list) return;
        const idx = list.findIndex(
          (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
        );
        if (idx >= 0) {
          const updated = {
            ...list[idx],
            comments: update.comments?.trim() || '',
          } as CompanyWithMarketData;
          this.marketData = {
            ...this.marketData!,
            companies: [...list.slice(0, idx), updated, ...list.slice(idx + 1)],
          };
        }

        this.companyStore.updateComment(update.companyId, update.comments ?? '');
      },
    });
  }

  editRow(company: CompanyWithMarketData, index: number): void {
    // Build occurrence counts map from company data for modal compatibility
    const occurrenceCounts = new Map<string, number>();
    this.marketData?.companies?.forEach((c) => {
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
        const list = this.marketData?.companies;
        if (!list) return;
        const idx = list.findIndex(
          (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
        );
        if (idx >= 0) {
          const current = list[idx];
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
          this.marketData = {
            ...this.marketData!,
            companies: [...list.slice(0, idx), updated, ...list.slice(idx + 1)],
          };
        }

        this.companyStore.updateComment(update.companyId, update.comments ?? '');
        this.companyStore.updateCategory(update.companyId, update.categoryName);
      },
      companiesList: this.marketData?.companies || [],
      currentIndex: index,
      occurrenceCounts: occurrenceCounts,
    });
  }
}
