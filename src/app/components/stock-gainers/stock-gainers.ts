import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { DatabaseService } from '../../services/database.service';
import {
  StockData,
  StockGainersResponse,
  MarketDataResponse,
  CompanyWithMarketData,
} from '../../interfaces/stock-data.interface';

@Component({
  selector: 'app-stock-gainers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-gainers.html',
  styleUrl: './stock-gainers.scss',
})
export class StockGainersComponent implements OnInit {
  private stockService = inject(StockService);
  private databaseService = inject(DatabaseService);

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

  // New properties for database structure
  marketData: MarketDataResponse = { date: '', companies: [] };
  availableDates: string[] = [];
  selectedDate: string = '';
  showHistoricalData: boolean = false;

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
        await this.loadAvailableDates(); // Refresh available dates
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

  // Load available dates from database
  async loadAvailableDates(): Promise<void> {
    try {
      this.availableDates = await this.databaseService.getAvailableDates();
    } catch (error) {
      console.error('Error loading available dates:', error);
      this.availableDates = [];
    }
  }

  // Load market data for selected date
  async loadMarketDataForDate(): Promise<void> {
    if (!this.selectedDate) return;

    try {
      this.marketData = await this.stockService.getMarketData(this.selectedDate);
      this.showHistoricalData = true;
    } catch (error) {
      console.error('Error loading market data:', error);
      this.marketData = { date: this.selectedDate, companies: [] };
    }
  }

  // Legacy methods for backward compatibility
  async saveToSupabase(): Promise<void> {
    if (!this.showData || this.stockData.stocks.length === 0) {
      alert('No data to save');
      return;
    }

    this.isSaving = true;
    this.saveMessage = '';

    try {
      const success = await this.stockService.saveToSupabase(this.stockData);

      if (success) {
        this.saveMessage = 'Data saved successfully to Supabase!';
        setTimeout(() => {
          this.saveMessage = '';
        }, 3000);
      } else {
        this.saveMessage = 'Failed to save data. Please try again.';
      }
    } catch (error) {
      this.saveMessage = 'Error saving data. Please try again.';
    } finally {
      this.isSaving = false;
    }
  }

  clearData(): void {
    this.tableInput = '';
    this.dateInput = this.getTodayDate(); // Reset to today's date
    this.stockData = { date: '', stocks: [] };
    this.marketData = { date: '', companies: [] };
    this.showData = false;
    this.showHistoricalData = false;
    this.saveMessage = '';
    this.selectedDate = '';
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

  trackByStock(index: number, stock: StockData): string {
    return stock.symbol;
  }

  trackByCompany(index: number, company: CompanyWithMarketData): string {
    return company.id;
  }

  // Initialize component
  async ngOnInit(): Promise<void> {
    this.dateInput = this.getTodayDate(); // Set today's date as default
    await this.loadAvailableDates();
  }
}
