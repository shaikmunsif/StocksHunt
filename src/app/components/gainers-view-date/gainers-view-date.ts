import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { AuthService } from '../../services/auth.service';
import { BreakpointService } from '../../services/breakpoint.service';
import { MarketDataResponse, CompanyWithMarketData } from '../../interfaces/stock-data.interface';
import { DialogService } from '../dialog/dialog.service';
import { CommentModalComponent } from '../comment-modal/comment-modal.component';
import { EditCompanyModalComponent } from '../edit-company-modal/edit-company-modal.component';
import { ShimmerLoaderComponent } from '../shimmer-loader/shimmer-loader.component';
import { CompanyStore } from '../../stores/company.store';

@Component({
  selector: 'app-gainers-view-date',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ShimmerLoaderComponent],
  templateUrl: './gainers-view-date.html',
  styleUrls: ['./gainers-view-date.scss'],
})
export class GainersViewDateComponent implements OnInit {
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

  // Occurrence tracking
  occurrenceCounts: Map<string, number> = new Map();

  // Sorting properties
  sortColumn: string = 'occurrence_count';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private databaseService: DatabaseService,
    private authService: AuthService,
    private dialogService: DialogService,
    public breakpointService: BreakpointService
  ) {}

  private readonly companyStore = inject(CompanyStore);

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
      // Step 1: Fetch market data (0-20%) with simulated incremental progress
      this.loadingProgress = 5;

      // Simulate realistic loading progress during API call
      const progressInterval = setInterval(() => {
        if (this.loadingProgress < 18) {
          this.loadingProgress += 1;
        }
      }, 50); // Increment every 50ms

      const data = await this.databaseService.getMarketDataByDate(this.selectedDate);
      clearInterval(progressInterval);
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

      this.marketData = data;

      // Step 3: Load occurrence counts with real-time progress (25-95%)
      if (data.companies) {
        await this.loadOccurrenceCounts(data.companies);
      }

      // Step 4: Apply sorting (95-98%)
      this.loadingProgress = 95;
      await new Promise((resolve) => setTimeout(resolve, 50));

      if (data.companies) {
        this.sortData(data.companies);
      }
      this.loadingProgress = 98;

      // Step 5: Complete (98-100%)
      await new Promise((resolve) => setTimeout(resolve, 100));
      this.loadingProgress = 100;
    } catch (error) {
      console.error('Error loading market data:', error);
      this.error = 'Failed to load market data. Please try again.';
    } finally {
      this.isLoading = false;
      this.loadingProgress = 0;
    }
  }

  sortData(companies: CompanyWithMarketData[]): void {
    companies.sort((a, b) => {
      let aValue: any;
      let bValue: any;

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

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return this.sortDirection === 'asc'
          ? (aValue || 0) - (bValue || 0)
          : (bValue || 0) - (aValue || 0);
      }
    });
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    if (this.marketData?.companies) {
      this.sortData(this.marketData.companies);
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
    if (price === undefined || price === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  formatChange(change?: number): string {
    if (change === undefined || change === null) return 'N/A';
    return `${change.toFixed(2)}%`;
  }

  getChangeClass(change?: number): string {
    if (change === undefined || change === null) return 'text-gray-500';
    return change >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
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

  trackByDate(index: number, item: string): string {
    return item;
  }

  trackByExchange(index: number, item: string): string {
    return item;
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

  async loadOccurrenceCounts(companies: CompanyWithMarketData[]): Promise<void> {
    this.occurrenceCounts.clear();
    const totalCompanies = companies.length;
    const baseProgress = 25; // Starting from 25%
    const progressRange = 70; // Will go from 25% to 95% (70 points)

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const count = await this.databaseService.getCompanyOccurrenceCount(company.ticker_symbol);
      this.occurrenceCounts.set(company.ticker_symbol, count);

      // Calculate realistic incremental progress for each company (25-95%)
      this.loadingProgress = baseProgress + Math.round(((i + 1) / totalCompanies) * progressRange);
    }
  }

  getOccurrenceCount(company: CompanyWithMarketData): number {
    return this.occurrenceCounts.get(company.ticker_symbol) || 0;
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
          list[idx] = {
            ...list[idx],
            comments: update.comments?.trim() || '',
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
          list[idx] = {
            ...list[idx],
            comments: update.comments?.trim() || '',
          };
        }

        this.companyStore.updateComment(update.companyId, update.comments ?? '');
      },
    });
  }

  editRow(company: CompanyWithMarketData, index: number): void {
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
          list[idx] = {
            ...current,
            comments: update.comments?.trim() || '',
            category:
              update.categoryName !== null
                ? { ...(current.category || ({} as any)), name: update.categoryName }
                : undefined,
          } as CompanyWithMarketData;
        }

        this.companyStore.updateComment(update.companyId, update.comments ?? '');
        this.companyStore.updateCategory(update.companyId, update.categoryName);
      },
      companiesList: this.marketData?.companies || [],
      currentIndex: index,
      occurrenceCounts: this.occurrenceCounts,
    });
  }
}
