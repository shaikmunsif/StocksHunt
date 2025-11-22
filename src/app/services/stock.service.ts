import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import {
  StockData,
  StockGainersResponse,
  ParsedStockData,
  MarketDataResponse,
} from '../interfaces/stock-data.interface';

@Injectable({
  providedIn: 'root',
})
export class StockService {
  constructor(private databaseService: DatabaseService) {}

  // Legacy method for backward compatibility
  parseTableData(tableInput: string, dateInput: string): StockGainersResponse {
    const stocks: StockData[] = [];

    // Split by new lines and filter out empty lines
    const lines = tableInput.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      return { date: dateInput.trim(), stocks: [] };
    }

    // Skip header row and process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by tabs
      const columns = line.split('\t').map((col) => col.trim());

      if (columns.length >= 4) {
        try {
          // Extract company name and symbol from first column
          const companyColumn = columns[0];
          const companyMatch = companyColumn.match(/([A-Z]+)\s+(.+)/);
          const symbol = companyMatch?.[1] || '';
          const company = companyMatch?.[2] || companyColumn;

          // Extract change percent
          const changeText = columns[1];
          const changeMatch = changeText.match(/([\d.]+)%?/);
          const changePercent = changeMatch ? parseFloat(changeMatch[1]) : 0;

          // Extract current price
          const currentPriceText = columns[2];
          const currentPrice = parseFloat(currentPriceText.replace(/,/g, '')) || 0;

          // Extract last day price
          const lastDayPriceText = columns[3];
          const lastDayPrice = parseFloat(lastDayPriceText.replace(/,/g, '')) || 0;

          stocks.push({
            company: company.trim(),
            symbol: symbol.trim(),
            changePercent,
            currentPrice,
            lastDayPrice,
          });
        } catch (error) {
          console.error('Error parsing stock row:', error, 'Row:', line);
        }
      }
    }

    return {
      date: dateInput.trim(),
      stocks: stocks.sort((a, b) => b.changePercent - a.changePercent),
    };
  }

  // New method to parse data for database storage
  parseTableDataForDatabase(tableInput: string): ParsedStockData[] {
    const stocks: ParsedStockData[] = [];

    // Split by new lines and filter out empty lines
    const lines = tableInput.split('\n').filter((line) => line.trim());

    if (lines.length === 0) {
      return stocks;
    }

    // Skip header row and process data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by tabs
      const columns = line.split('\t').map((col) => col.trim());

      if (columns.length >= 4) {
        try {
          // Extract company name and symbol from first column
          const companyColumn = columns[0];
          const companyMatch = companyColumn.match(/([A-Z]+)\s+(.+)/);
          const tickerSymbol = companyMatch?.[1] || '';
          const companyName = companyMatch?.[2] || companyColumn;

          // Extract change percent
          const changeText = columns[1];
          const changeMatch = changeText.match(/([\d.]+)%?/);
          const changePercent = changeMatch ? parseFloat(changeMatch[1]) : 0;

          // Extract current price
          const currentPriceText = columns[2];
          const currentPrice = parseFloat(currentPriceText.replace(/,/g, '')) || 0;

          // Extract last day price
          const lastDayPriceText = columns[3];
          const lastDayPrice = parseFloat(lastDayPriceText.replace(/,/g, '')) || 0;

          stocks.push({
            tickerSymbol: tickerSymbol.trim(),
            companyName: companyName.trim(),
            changePercent,
            currentPrice,
            lastDayPrice,
          });
        } catch (error) {
          console.error('Error parsing stock row:', error, 'Row:', line);
        }
      }
    }

    return stocks.sort((a, b) => b.changePercent - a.changePercent);
  }

  // Save to new database structure
  async saveToDatabase(
    tableInput: string,
    date: string,
    exchangeCode: string = 'NSE',
    progressCallback?: (progress: number, message: string) => void
  ): Promise<boolean> {
    try {
      const parsedData = this.parseTableDataForDatabase(tableInput);
      if (parsedData.length === 0) {
        return false;
      }

      return await this.databaseService.saveMarketData(parsedData, date, exchangeCode, progressCallback);
    } catch (error) {
      console.error('Error saving to database:', error);
      return false;
    }
  }

  // Get data from new database structure
  async getMarketData(date: string): Promise<MarketDataResponse> {
    try {
      return await this.databaseService.getMarketDataByDate(date);
    } catch (error) {
      console.error('Error fetching market data:', error);
      return { date, companies: [] };
    }
  }

  // Legacy Supabase methods (for backward compatibility)
  async saveToSupabase(
    stockData: StockGainersResponse,
    exchangeCode: string = 'NSE'
  ): Promise<boolean> {
    try {
      // Convert legacy format to new format and save
      const parsedData: ParsedStockData[] = stockData.stocks.map((stock) => ({
        tickerSymbol: stock.symbol,
        companyName: stock.company,
        changePercent: stock.changePercent,
        currentPrice: stock.currentPrice,
        lastDayPrice: stock.lastDayPrice,
      }));

      return await this.databaseService.saveMarketData(parsedData, stockData.date, exchangeCode);
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      return false;
    }
  }
}
