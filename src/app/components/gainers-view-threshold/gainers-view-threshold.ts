import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { BreakpointService } from '../../services/breakpoint.service';
import {
  CompanyWithMarketData,
  GroupedCompanyOccurrence,
  MarketData,
  MarketDataResponse,
} from '../../interfaces/stock-data.interface';
import { DialogService } from '../dialog/dialog.service';
import { CommentModalComponent } from '../comment-modal/comment-modal.component';
import { EditCompanyModalComponent } from '../edit-company-modal/edit-company-modal.component';

@Component({
  selector: 'app-gainers-view-threshold',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './gainers-view-threshold.html',
  styleUrls: ['./gainers-view-threshold.scss'],
})
export class GainersViewThresholdComponent implements OnInit {
  isLoading = false;
  loadingProgress = 0;
  error: string | null = null;
  availableDates: string[] = [];

  repeatThreshold = 1;
  exchangeMode: 'all' | 'one' | 'none' = 'all';
  selectedExchange = 'NSE';
  readonly exchanges = ['NSE', 'BSE'];

  repeatedCompanies: GroupedCompanyOccurrence[] = [];

  sortColumn:
    | 'ticker_symbol'
    | 'name'
    | 'current_price'
    | 'average_change'
    | 'category'
    | 'occurrence_count' = 'occurrence_count';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly dialogService: DialogService,
    public breakpointService: BreakpointService
  ) {}

  ngOnInit(): void {
    this.loadAvailableDates();
  }

  async loadAvailableDates(): Promise<void> {
    try {
      this.availableDates = await this.databaseService.getAvailableDates();
      await this.loadMarketData();
    } catch (err) {
      console.error('Error loading available dates:', err);
      this.error = 'Unable to load the list of available dates. Please try again later.';
    }
  }

  async loadMarketData(): Promise<void> {
    if (!this.availableDates.length) {
      this.repeatedCompanies = [];
      return;
    }

    this.isLoading = true;
    this.loadingProgress = 0;
    this.error = null;

    try {
      const aggregatedCompanies: CompanyWithMarketData[] = [];
      const totalDates = this.availableDates.length;

      for (let i = 0; i < this.availableDates.length; i++) {
        const date = this.availableDates[i];
        const data: MarketDataResponse = await this.databaseService.getMarketDataByDate(date);

        // Update progress
        this.loadingProgress = Math.round(((i + 1) / totalDates) * 100);

        if (!data?.companies?.length) {
          continue;
        }

        const filtered = this.applyExchangeFilter(data.companies);
        aggregatedCompanies.push(...filtered);
      }

      this.repeatedCompanies = this.groupRepeatedCompanies(aggregatedCompanies);
      this.sortData(this.repeatedCompanies);
    } catch (err) {
      console.error('Error loading threshold market data:', err);
      this.error = 'Failed to load market data. Please retry in a moment.';
      this.repeatedCompanies = [];
    } finally {
      this.isLoading = false;
      this.loadingProgress = 0;
    }
  }

  private applyExchangeFilter(companies: CompanyWithMarketData[]): CompanyWithMarketData[] {
    if (this.exchangeMode === 'one') {
      return companies.filter((company) => company.exchange?.code === this.selectedExchange);
    }

    if (this.exchangeMode === 'none') {
      return companies;
    }

    // `all` mode includes every exchange represented in the data
    return companies;
  }

  private groupRepeatedCompanies(companies: CompanyWithMarketData[]): GroupedCompanyOccurrence[] {
    const groupedMap = new Map<
      string,
      { company: CompanyWithMarketData; occurrences: MarketData[] }
    >();

    companies.forEach((company) => {
      const key = company.ticker_symbol;
      if (!key) {
        return;
      }

      if (!groupedMap.has(key)) {
        groupedMap.set(key, { company, occurrences: [] });
      }

      if (company.market_data) {
        groupedMap.get(key)!.occurrences.push(company.market_data);
      }
    });

    const groupedResults: GroupedCompanyOccurrence[] = [];

    groupedMap.forEach(({ company, occurrences }) => {
      if (occurrences.length <= this.repeatThreshold) {
        return;
      }

      const sortedOccurrences = [...occurrences].sort(
        (a, b) => new Date(b.record_date).getTime() - new Date(a.record_date).getTime()
      );

      const totalChange = occurrences.reduce((sum, item) => sum + (item.percentage_change ?? 0), 0);
      const averageChange = occurrences.length ? totalChange / occurrences.length : 0;
      const latestPrice = sortedOccurrences[0]?.current_price ?? 0;

      groupedResults.push({
        id: company.id,
        ticker_symbol: company.ticker_symbol,
        name: company.name,
        comments: company.comments,
        exchange_id: company.exchange_id,
        category_id: company.category_id,
        exchange: company.exchange,
        category: company.category,
        occurrenceCount: occurrences.length,
        averageChange,
        latestPrice,
        occurrences: sortedOccurrences,
      });
    });

    return groupedResults;
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
      this.sortDirection = 'asc';
    }

    this.sortData(this.repeatedCompanies);
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
    if (price === undefined || price === null) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  formatChange(change?: number): string {
    if (change === undefined || change === null) {
      return 'N/A';
    }
    return `${change.toFixed(2)}%`;
  }

  getChangeClass(change?: number): string {
    if (change === undefined || change === null) {
      return 'text-gray-500';
    }
    return change >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
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

  addComment(company: GroupedCompanyOccurrence): void {
    this.dialogService.open(CommentModalComponent, {
      companyId: company.id,
      companyName: company.name,
      tickerSymbol: company.ticker_symbol,
      comment: '',
      onSave: () => this.loadMarketData(),
    });
  }

  editComment(company: GroupedCompanyOccurrence): void {
    this.dialogService.open(CommentModalComponent, {
      companyId: company.id,
      companyName: company.name,
      tickerSymbol: company.ticker_symbol,
      comment: company.comments || '',
      onSave: () => this.loadMarketData(),
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
      onSave: () => this.loadMarketData(),
      companiesList: this.repeatedCompanies as any[], // Cast since it's compatible interface
      currentIndex: index,
      occurrenceCounts: occurrenceCounts,
    });
  }
}
