// Exchange interface
export interface Exchange {
  id: number;
  code: string;
  name?: string;
}

// Category interface
export interface Category {
  id: number;
  name: string;
}

// Company interface
export interface Company {
  id: string;
  ticker_symbol: string;
  name: string;
  comments?: string;
  exchange_id?: number;
  category_id?: number;
  exchange?: Exchange;
  category?: Category;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Market data interface
export interface MarketData {
  id: number;
  company_id: string;
  record_date: string;
  current_price?: number;
  previous_close?: number;
  percentage_change?: number;
  updated_by?: string;
  updated_at?: string;
  company?: Company;
}

// Enhanced company with market data for display
export interface CompanyWithMarketData extends Company {
  market_data?: MarketData;
  expanded?: boolean; // For UI state - expandable comments
  occurrence_count?: number; // Pre-calculated from database view
}

export interface GroupedCompanyOccurrence extends Company {
  occurrenceCount: number;
  averageChange: number;
  latestPrice: number;
  /**
   * The latest date for which market data is available for this company.
   * May be undefined if there are no occurrences or if the data source does not provide a latest date.
   */
  latestDate?: string;
  occurrences: MarketData[];
  expanded?: boolean; // For UI state - expandable comments
}

// Response from get_market_data_by_date RPC function
export interface MarketDataByDateRpcResponse {
  market_data_id: number;
  company_id: string;
  record_date: string;
  current_price?: number;
  previous_close?: number;
  percentage_change?: number;
  ticker_symbol: string;
  company_name: string;
  comments?: string;
  exchange_id?: number;
  category_id?: number;
  exchange_code?: string;
  exchange_name?: string;
  category_name?: string;
  occurrence_count: number;
}

// Response from get_company_market_summary RPC function
export interface CompanyMarketSummaryRpcResponse {
  company_id: string;
  ticker_symbol: string;
  company_name: string;
  comments?: string;
  exchange_id?: number;
  category_id?: number;
  exchange_code?: string;
  exchange_name?: string;
  category_name?: string;
  occurrence_count: number;
  average_change: number;
  latest_price: number;
  latest_date?: string;
}

export interface MarketDataResponse {
  date: string;
  companies: CompanyWithMarketData[];
}

// Parsed stock data input
export interface ParsedStockData {
  tickerSymbol: string;
  companyName: string;
  changePercent: number;
  currentPrice: number;
  lastDayPrice: number;
}

export interface StockData {
  company: string;
  symbol: string;
  changePercent: number;
  currentPrice: number;
  lastDayPrice: number;
}

export interface StockGainersResponse {
  date: string;
  stocks: StockData[];
}
