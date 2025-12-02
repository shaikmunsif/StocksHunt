import { Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { StockGainersResponse } from '../../interfaces/stock-data.interface';

@Component({
  selector: 'app-stock-gainers',
  imports: [FormsModule, DatePipe],
  templateUrl: './stock-gainers.html',
  styleUrl: './stock-gainers.scss',
})
export class StockGainersComponent implements OnInit {
  private stockService = inject(StockService);

  private readonly PROGRESS_DISPLAY_DELAY_MS = 500;

  // Legacy properties for backward compatibility
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

  // Legacy method for backward compatibility
  parseAndDisplayData(): void {
    if (!this.tableInput.trim()) {
      alert('Please paste table data');
      return;
    }

    this.stockData = this.stockService.parseTableData(this.tableInput, this.dateInput);
    this.showData = true;
    this.saveMessage = '';
  }

  // New method to save to database structure
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

  // Initialize component
  ngOnInit(): void {
    this.dateInput = this.getTodayDate(); // Set today's date as default
  }
}
