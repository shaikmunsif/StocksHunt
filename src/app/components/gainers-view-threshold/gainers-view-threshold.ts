import { Component, OnInit, inject } from '@angular/core';
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
  styleUrls: ['./gainers-view-threshold.scss'],
})
export class GainersViewThresholdComponent implements OnInit {
  private readonly databaseService = inject(DatabaseService);
  private readonly dialogService = inject(DialogService);
  readonly breakpointService = inject(BreakpointService);

  isLoading = false;
  loadingProgress = 0;
  error: string | null = null;
  availableDates: string[] = [];

  repeatThreshold = 1;
  exchangeMode: 'all' | 'one' | 'none' = 'all';
  selectedExchange = 'NSE';
  readonly exchanges = ['NSE', 'BSE'];

  repeatedCompanies: GroupedCompanyOccurrence[] = [];
  private exchangesCache: Exchange[] = [];

  sortColumn:
    | 'ticker_symbol'
    | 'name'
    | 'current_price'
    | 'average_change'
    | 'category'
    | 'occurrence_count' = 'occurrence_count';
  sortDirection: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.loadAvailableDates();
  }

  async loadAvailableDates(): Promise<void> {
    try {
      // Load exchanges for ID lookup
      this.exchangesCache = await this.databaseService.getExchanges();
      await this.loadMarketData();
    } catch (err) {
      console.error('Error loading initial data:', err);
      this.error = 'Unable to load data. Please try again later.';
    }
  }

  async loadMarketData(): Promise<void> {
    this.isLoading = true;
    this.loadingProgress = 0;
    this.error = null;

    try {
      this.loadingProgress = 20;

      // Get exchange ID if filtering by specific exchange
      let exchangeId: number | undefined;
      if (this.exchangeMode === 'one') {
        const exchange = this.exchangesCache.find((e) => e.code === this.selectedExchange);
        exchangeId = exchange?.id;
      }

      this.loadingProgress = 40;

      // Single API call using the optimized view!
      this.repeatedCompanies = await this.databaseService.getCompanyMarketSummary(
        this.repeatThreshold,
        exchangeId
      );

      this.loadingProgress = 80;

      this.sortData(this.repeatedCompanies);
      this.loadingProgress = 100;
    } catch (err) {
      console.error('Error loading threshold market data:', err);
      this.error = 'Failed to load market data. Please retry in a moment.';
      this.repeatedCompanies = [];
    } finally {
      this.isLoading = false;
      this.loadingProgress = 0;
    }
  }

  onRepeatThresholdChange(): void {
    this.loadMarketData();
  }

  onExchangeModeChange(): void {
    if (this.exchangeMode !== 'one') {
      this.selectedExchange = 'NSE';
    }
    this.loadMarketData();
  }

  onExchangeChange(): void {
    if (this.exchangeMode === 'one') {
      this.loadMarketData();
    }
  }

  onSort(column: typeof this.sortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = this.getDefaultSortDirection(column);
    }

    this.sortData(this.repeatedCompanies);
  }

  /**
   * Returns the default sort direction for a column based on user expectations.
   * Numeric columns default to descending (highest first), text columns to ascending (A-Z).
   */
  private getDefaultSortDirection(column: typeof this.sortColumn): 'asc' | 'desc' {
    switch (column) {
      case 'ticker_symbol':
      case 'name':
      case 'category':
        return 'asc'; // Alphabetical columns: A-Z first
      case 'current_price':
      case 'average_change':
      case 'occurrence_count':
        return 'desc'; // Numeric columns: highest first
      default:
        return 'asc';
    }
  }

  private sortData(companies: GroupedCompanyOccurrence[]): void {
    companies.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (this.sortColumn) {
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
        return this.sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const numericComparison = Number(aValue) - Number(bValue);
      return this.sortDirection === 'asc' ? numericComparison : -numericComparison;
    });
  }

  getSortIcon(column: typeof this.sortColumn): string {
    if (this.sortColumn !== column) {
      return 'M7 11l5-5m0 0l5 5m-5-5v12';
    }
    return this.sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7';
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
    switch (this.exchangeMode) {
      case 'one':
        return this.selectedExchange;
      case 'none':
        return 'No Exchange Filter';
      default:
        return 'All Exchanges';
    }
  }

  async exportToCSV(): Promise<void> {
    if (!this.repeatedCompanies.length) {
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

    const rows = this.repeatedCompanies.map((company) => [
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
    anchor.download = `gainers_grouped_${this.exchangeMode}_threshold${this.repeatThreshold}.csv`;
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

  /**
   * Toggles the expanded state of a company's comment section.
   * Using a method ensures proper change detection.
   */
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
        const list = this.repeatedCompanies;
        const idx = list.findIndex(
          (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
        );
        if (idx >= 0) {
          const updated: GroupedCompanyOccurrence = {
            ...list[idx],
            comments: update.comments?.trim() || '',
          };
          this.repeatedCompanies = [...list.slice(0, idx), updated, ...list.slice(idx + 1)];
        }
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
        const list = this.repeatedCompanies;
        const idx = list.findIndex(
          (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
        );
        if (idx >= 0) {
          const updated: GroupedCompanyOccurrence = {
            ...list[idx],
            comments: update.comments?.trim() || '',
          };
          this.repeatedCompanies = [...list.slice(0, idx), updated, ...list.slice(idx + 1)];
        }
      },
    });
  }

  editRow(company: GroupedCompanyOccurrence, index: number): void {
    // Create occurrence counts map for navigation
    const occurrenceCounts = new Map<string, number>();
    this.repeatedCompanies.forEach((c) => {
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
        const list = this.repeatedCompanies;
        const idxToUpdate = list.findIndex(
          (c) => c.id === update.companyId || c.ticker_symbol === update.tickerSymbol
        );
        if (idxToUpdate >= 0) {
          const current = list[idxToUpdate];
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
          this.repeatedCompanies = [
            ...list.slice(0, idxToUpdate),
            updated,
            ...list.slice(idxToUpdate + 1),
          ];
        }
      },
      companiesList: this.repeatedCompanies,
      currentIndex: index,
      occurrenceCounts: occurrenceCounts,
    });
  }
}
