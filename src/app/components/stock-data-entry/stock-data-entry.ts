import { Component, inject, OnInit, OnDestroy, HostListener, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { StockGainersResponse } from '../../interfaces/stock-data.interface';

@Component({
  selector: 'app-stock-data-entry',
  imports: [FormsModule, DatePipe],
  templateUrl: './stock-data-entry.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './stock-data-entry.scss',
})
export class StockDataEntryComponent implements OnInit, OnDestroy {
  private stockService = inject(StockService);

  private readonly PROGRESS_DISPLAY_DELAY_MS = 500;

  stockData = signal<StockGainersResponse>({ date: '', stocks: [] });
  dateInput = signal<string>('');
  tableInput = signal<string>('');
  showData = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  saveMessage = signal<string>('');
  saveProgress = signal<number>(0);
  saveProgressMessage = signal<string>('');
  selectedExchange = signal<string>('NSE');
  expandedCards = signal<{ [key: string]: boolean }>({});
  showScrollTop = signal<boolean>(false);

  readonly exchanges: string[] = ['NSE', 'BSE'];

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollTop.set(window.scrollY > 300);
  }

  parseAndDisplayData(): void {
    if (!this.tableInput().trim()) {
      alert('Please paste table data');
      return;
    }

    this.stockData.set(this.stockService.parseTableData(this.tableInput(), this.dateInput()));
    this.showData.set(true);
    this.saveMessage.set('');
    this.expandedCards.set({});
  }

  async saveToDatabase(): Promise<void> {
    if (!this.tableInput().trim() || !this.dateInput()) {
      alert('Please provide both table data and date');
      return;
    }

    this.isSaving.set(true);
    this.saveMessage.set('');
    this.saveProgress.set(0);
    this.saveProgressMessage.set('');

    try {
      const success = await this.stockService.saveToDatabase(
        this.tableInput(),
        this.dateInput(),
        this.selectedExchange(),
        (progress: number, message: string) => {
          this.saveProgress.set(progress);
          this.saveProgressMessage.set(message);
        }
      );

      if (success) {
        this.saveMessage.set('Data saved successfully to database!');
        this.saveProgress.set(100);
        this.saveProgressMessage.set('Complete!');
        setTimeout(() => {
          this.saveMessage.set('');
          this.saveProgress.set(0);
          this.saveProgressMessage.set('');
        }, 3000);
      } else {
        this.saveMessage.set('Failed to save data. Please try again.');
      }
    } catch (error) {
      this.saveMessage.set('Error saving data. Please try again.');
    } finally {
      setTimeout(() => {
        this.isSaving.set(false);
      }, this.PROGRESS_DISPLAY_DELAY_MS);
    }
  }

  clearData(): void {
    this.tableInput.set('');
    this.dateInput.set(this.getTodayDate());
    this.stockData.set({ date: '', stocks: [] });
    this.showData.set(false);
    this.saveMessage.set('');
    this.selectedExchange.set('NSE');
    this.expandedCards.set({});
  }

  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatPrice(price: number): string {
    return price.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  toggleCardExpand(symbol: string): void {
    this.expandedCards.update(cards => ({ ...cards, [symbol]: !cards[symbol] }));
  }

  removeStock(index: number): void {
    if (confirm('Are you sure you want to remove this stock?')) {
      this.stockData.update(data => ({
        ...data,
        stocks: data.stocks.filter((_, i) => i !== index),
      }));
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  ngOnInit(): void {
    this.dateInput.set(this.getTodayDate());
  }

  ngOnDestroy(): void {
    // Clean up if needed
  }
}
