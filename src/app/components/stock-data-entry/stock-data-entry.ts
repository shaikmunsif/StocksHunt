import { Component, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { StockGainersResponse } from '../../interfaces/stock-data.interface';

@Component({
  selector: 'app-stock-data-entry',
  imports: [FormsModule, DatePipe],
  templateUrl: './stock-data-entry.html',
  styleUrl: './stock-data-entry.scss',
})
export class StockDataEntryComponent implements OnInit, OnDestroy {
  private stockService = inject(StockService);

  private readonly PROGRESS_DISPLAY_DELAY_MS = 500;

  // Stock data properties
  stockData: StockGainersResponse = { date: '', stocks: [] };
  dateInput: string = ''; // Will be set to today's date in ngOnInit
  tableInput: string = '';
  showData: boolean = false;
  isSaving: boolean = false;
  saveMessage: string = '';
  saveProgress: number = 0;
  saveProgressMessage: string = '';

  // Exchange selection
  selectedExchange: string = 'NSE'; // Default to NSE
  exchanges: string[] = ['NSE', 'BSE']; // Available exchanges

  // Mobile view state
  expandedCards: { [key: string]: boolean } = {};
  showScrollTop: boolean = false;

  // Scroll listener for scroll-to-top button
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollTop = window.scrollY > 300;
  }

  // Parse and display data
  parseAndDisplayData(): void {
    if (!this.tableInput.trim()) {
      alert('Please paste table data');
      return;
    }

    this.stockData = this.stockService.parseTableData(this.tableInput, this.dateInput);
    this.showData = true;
    this.saveMessage = '';
    this.expandedCards = {}; // Reset expanded cards
  }

  // Save to database
  async saveToDatabase(): Promise<void> {
    if (!this.tableInput.trim() || !this.dateInput) {
      alert('Please provide both table data and date');
      return;
    }

    this.isSaving = true;
    this.saveMessage = '';
    this.saveProgress = 0;
    this.saveProgressMessage = '';

    try {
      const success = await this.stockService.saveToDatabase(
        this.tableInput,
        this.dateInput,
        this.selectedExchange,
        (progress: number, message: string) => {
          this.saveProgress = progress;
          this.saveProgressMessage = message;
        }
      );

      if (success) {
        this.saveMessage = 'Data saved successfully to database!';
        this.saveProgress = 100;
        this.saveProgressMessage = 'Complete!';
        setTimeout(() => {
          this.saveMessage = '';
          this.saveProgress = 0;
          this.saveProgressMessage = '';
        }, 3000);
      } else {
        this.saveMessage = 'Failed to save data. Please try again.';
      }
    } catch (error) {
      this.saveMessage = 'Error saving data. Please try again.';
    } finally {
      setTimeout(() => {
        this.isSaving = false;
      }, this.PROGRESS_DISPLAY_DELAY_MS); // Keep showing final progress briefly
    }
  }

  clearData(): void {
    this.tableInput = '';
    this.dateInput = this.getTodayDate(); // Reset to today's date
    this.stockData = { date: '', stocks: [] };
    this.showData = false;
    this.saveMessage = '';
    this.selectedExchange = 'NSE'; // Reset to default exchange
    this.expandedCards = {}; // Reset expanded cards
  }

  // Helper method to get today's date in YYYY-MM-DD format
  getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Utility methods
  formatPrice(price: number): string {
    return price.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  // Mobile card expand/collapse
  toggleCardExpand(symbol: string): void {
    this.expandedCards[symbol] = !this.expandedCards[symbol];
  }

  // Remove stock from list (swipe-to-delete functionality)
  removeStock(index: number): void {
    if (confirm('Are you sure you want to remove this stock?')) {
      this.stockData.stocks.splice(index, 1);
    }
  }

  // Scroll to top
  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Initialize component
  ngOnInit(): void {
    this.dateInput = this.getTodayDate(); // Set today's date as default
  }

  ngOnDestroy(): void {
    // Clean up if needed
  }
}
