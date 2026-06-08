import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { BreakpointService } from '../../services/breakpoint.service';
import { GroupedCompanyOccurrence, Exchange } from '../../interfaces/stock-data.interface';
import { DialogService } from '../dialog/dialog.service';
import { CommentModalComponent } from '../comment-modal/comment-modal.component';
import { EditCompanyModalComponent } from '../edit-company-modal/edit-company-modal.component';
import { ShimmerLoaderComponent } from '../shimmer-loader/shimmer-loader.component';
import {
  formatPrice as formatPriceUtil,
  formatChange as formatChangeUtil,
  getChangeClass as getChangeClassUtil,
} from '../../utils/format.utils';

@Component({
  selector: 'app-gainers-view-threshold',
  imports: [FormsModule, ShimmerLoaderComponent],
  templateUrl: './gainers-view-threshold.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./gainers-view-threshold.scss'],
})
export class GainersViewThresholdComponent implements OnInit {
  private readonly databaseService = inject(DatabaseService);
  private readonly dialogService = inject(DialogService);
  readonly breakpointService = inject(BreakpointService);

  isLoading = signal(false);
  loadingProgress = signal(0);
  error = signal<string | null>(null);
  availableDates = signal<string[]>([]);

  repeatThreshold = signal(1);
  exchangeMode = signal<'all' | 'one' | 'none'>('all');
  selectedExchange = signal('NSE');
  readonly exchanges = ['NSE', 'BSE'];

  repeatedCompanies = signal<GroupedCompanyOccurrence[]>([]);
  exchangesCache = signal<Exchange[]>([]);

  sortColumn = signal<'ticker_symbol' | 'name' | 'current_price' | 'average_change' | 'category' | 'occurrence_count'>('occurrence_count');
  sortDirection = signal<'asc' | 'desc'>('desc');

  getCategoryClass(categoryName?: string): string {
    const isAvoid = categoryName === 'Avoid';
    return isAvoid
      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  }

  getRowClass(categoryName?: string): string {
    const isAvoid = categoryName === 'Avoid';
    return isAvoid
      ? 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-800/30'
      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50';
  }

  ngOnInit(): void {
    this.loadAvailableDates();
  }

  async loadAvailableDates(): Promise<void> {
    try {
      this.exchangesCache.set(await this.databaseService.getExchanges());
      await this.loadMarketData();
    } catch (err) {
      console.error('Error loading initial data:', err);
      this.error.set('Unable to load exchanges. Please try again later.');
    }
  }

  async loadMarketData(): Promise<void> {
    this.isLoading.set(true);
    this.loadingProgress.set(0);
    this.error.set(null);

    try {
      this.loadingProgress.set(20);

      let exchangeId: number | undefined;
      if (this.exchangeMode() === 'one') {
        const exchange = this.exchangesCache().find((e) => e.code === this.selectedExchange());
        exchangeId = exchange?.id;
      }

      this.loadingProgress.set(40);

      const companies = await this.databaseService.getCompanyMarketSummary(
        this.repeatThreshold(),
        exchangeId
      );

      this.loadingProgress.set(80);

      this.repeatedCompanies.set(this.sortDataToArray(companies));
      this.loadingProgress.set(100);
    } catch (err) {
      console.error('Error loading threshold market data:', err);
      this.error.set('Failed to load market data. Please retry in a moment.');
      this.repeatedCompanies.set([]);
    } finally {
      this.isLoading.set(false);
      this.loadingProgress.set(0);
    }
  }

  onRepeatThresholdChange(): void {
    this.loadMarketData();
  }

  onExchangeModeChange(): void {
    if (this.exchangeMode() !== 'one') {
      this.selectedExchange.set('NSE');
    }
    this.loadMarketData();
  }

  onExchangeChange(): void {
    if (this.exchangeMode() === 'one') {
      this.loadMarketData();
    }
  }

  onSort(column: 'ticker_symbol' | 'name' | 'current_price' | 'average_change' | 'category' | 'occurrence_count'): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set(this.getDefaultSortDirection(column));
    }

    this.repeatedCompanies.update(companies => this.sortDataToArray([...companies]));
  }

  private getDefaultSortDirection(column: string): 'asc' | 'desc' {
    switch (column) {
      case 'ticker_symbol':
      case 'name':
      case 'category':
        return 'asc';
      case 'current_price':
      case 'average_change':
      case 'occurrence_count':
        return 'desc';
      default:
        return 'asc';
    }
  }

  private sortDataToArray(companies: GroupedCompanyOccurrence[]): GroupedCompanyOccurrence[] {
    const col = this.sortColumn();
    const dir = this.sortDirection();

    companies.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (col) {
        case 'ticker_symbol':
          aValue = a.ticker_symbol;
          bValue = b.ticker_symbol;
          break;
        case 'name':
          aValue = a.name ?? '';
          bValue = b.name ?? '';
          break;
        case 'current_price':
          aValue = a.latestPrice ?? 0;
          bValue = b.latestPrice ?? 0;
          break;
        case 'average_change':
          aValue = a.averageChange ?? 0;
          bValue = b.averageChange ?? 0;
          break;
        case 'category':
          aValue = a.category?.name ?? '';
          bValue = b.category?.name ?? '';
          break;
        case 'occurrence_count':
        default:
          aValue = a.occurrenceCount ?? 0;
          bValue = b.occurrenceCount ?? 0;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return dir === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const numericComparison = Number(aValue) - Number(bValue);
      return dir === 'asc' ? numericComparison : -numericComparison;
    });

    return companies;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn() !== column) {
      return 'M7 11l5-5m0 0l5 5m-5-5v12';
    }
    return this.sortDirection() === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7';
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

  getComment(company: GroupedCompanyOccurrence): string {
    return company.comments?.trim() || '-';
  }

  getExchangeModeLabel(): string {
    switch (this.exchangeMode()) {
      case 'one':
        return this.selectedExchange();
      case 'none':
        return 'No Exchange Filter';
      default:
        return 'All Exchanges';
    }
  }

  async exportToCSV(): Promise<void> {
    if (!this.repeatedCompanies().length) {
      alert('No data available to export.');
      return;
    }

    const headers = [
      'Ticker Symbol',
      'Company Name',
      'Latest Price',
      'Average Change %',
      'Category',
      'Occurrence Count',
      'Comments',
    ];

    const rows = this.repeatedCompanies().map((company) => [
      company.ticker_symbol,
      company.name ?? 'N/A',
      this.formatPrice(company.latestPrice),
      this.formatChange(company.averageChange),
      company.category?.name ?? 'N/A',
      company.occurrenceCount?.toString() ?? '0',
      this.getComment(company),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gainers_grouped_${this.exchangeMode()}_threshold${this.repeatThreshold()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }

  async refreshData(): Promise<void> {
    await this.loadMarketData();
  }

  trackByCompany(_: number, company: GroupedCompanyOccurrence): string {
    return company.ticker_symbol;
  }

  toggleExpanded(company: GroupedCompanyOccurrence): void {
    company.expanded = !company.expanded;
  }

  addComment(company: GroupedCompanyOccurrence): void {
    this.dialogService.open(CommentModalComponent, {
      companyId: company.id,
      companyName: company.name,
      tickerSymbol: company.ticker_symbol,
      comment: '',
      onSave: (update: { companyId: string; tickerSymbol: string; comments: string }) => {
        this.repeatedCompanies.update(list => {
          const idx = list.findIndex(
            (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
          );
          if (idx >= 0) {
            const updated: GroupedCompanyOccurrence = {
              ...list[idx],
              comments: update.comments?.trim() || '',
            };
            return [...list.slice(0, idx), updated, ...list.slice(idx + 1)];
          }
          return list;
        });
      },
    });
  }

  editComment(company: GroupedCompanyOccurrence): void {
    this.dialogService.open(CommentModalComponent, {
      companyId: company.id,
      companyName: company.name,
      tickerSymbol: company.ticker_symbol,
      comment: company.comments || '',
      onSave: (update: { companyId: string; tickerSymbol: string; comments: string }) => {
        this.repeatedCompanies.update(list => {
          const idx = list.findIndex(
            (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
          );
          if (idx >= 0) {
            const updated: GroupedCompanyOccurrence = {
              ...list[idx],
              comments: update.comments?.trim() || '',
            };
            return [...list.slice(0, idx), updated, ...list.slice(idx + 1)];
          }
          return list;
        });
      },
    });
  }

  editRow(company: GroupedCompanyOccurrence, index: number): void {
    const occurrenceCounts = new Map<string, number>();
    this.repeatedCompanies().forEach((c) => {
      occurrenceCounts.set(c.ticker_symbol, c.occurrenceCount || 0);
    });

    this.dialogService.open(EditCompanyModalComponent, {
      companyId: company.id,
      companyName: company.name,
      tickerSymbol: company.ticker_symbol,
      currentPrice: this.formatPrice(company.latestPrice),
      percentageChange: this.formatChange(company.averageChange),
      changeClass: this.getChangeClass(company.averageChange),
      occurrenceCount: company.occurrenceCount || 0,
      category: company.category?.name || '',
      comment: company.comments || '',
      onSave: (update: {
        companyId: string;
        tickerSymbol: string;
        categoryName: string | null;
        comments: string;
      }) => {
        this.repeatedCompanies.update(list => {
          const idx = list.findIndex(
            (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
          );
          if (idx >= 0) {
            const current = list[idx];
            const updated: GroupedCompanyOccurrence = {
              ...current,
              comments: update.comments?.trim() || '',
              category:
                update.categoryName !== null
                  ? current.category
                    ? { ...current.category, name: update.categoryName }
                    : undefined
                  : undefined,
            };
            return [...list.slice(0, idx), updated, ...list.slice(idx + 1)];
          }
          return list;
        });
      },
      companiesList: this.repeatedCompanies(),
      currentIndex: index,
      occurrenceCounts: occurrenceCounts,
    });
  }
}
