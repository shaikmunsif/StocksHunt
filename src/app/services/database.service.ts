import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {
  Exchange,
  Category,
  Company,
  MarketData,
  CompanyWithMarketData,
  MarketDataResponse,
  ParsedStockData,
} from '../interfaces/stock-data.interface';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  constructor(private authService: AuthService) {}

  // Exchange operations
  async getExchanges(): Promise<Exchange[]> {
    try {
      const { data, error } = await this.authService.supabase
        .from('exchanges')
        .select('*')
        .order('code');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching exchanges:', error);
      return [];
    }
  }

  async getExchangeByCode(code: string): Promise<Exchange | null> {
    try {
      const { data, error } = await this.authService.supabase
        .from('exchanges')
        .select('*')
        .eq('code', code)
        .maybeSingle(); // Use maybeSingle to handle no results

      if (error) {
        // Don't throw error for PGRST116 (no results), return null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching exchange:', error);
      return null;
    }
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await this.authService.supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async getOrCreateDefaultCategory(categoryName: string = 'Good'): Promise<Category> {
    try {
      // First try to get the category by name
      const { data: category, error: fetchError } = await this.authService.supabase
        .from('categories')
        .select('*')
        .eq('name', categoryName)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results

      if (fetchError) {
        console.error('Error fetching category:', fetchError);
        // Don't throw error for PGRST116 (no results), continue to create
        if (fetchError.code !== 'PGRST116') {
          throw fetchError;
        }
      }

      // If category exists, return it
      if (category) {
        return category;
      }

      // If not found, create it
      console.log(`Category '${categoryName}' not found, creating it...`);
      const { data: newCategory, error: createError } = await this.authService.supabase
        .from('categories')
        .insert([{ name: categoryName }])
        .select()
        .single();

      if (createError) {
        console.error('Error creating category:', createError);
        throw createError;
      }

      if (!newCategory) {
        throw new Error('Failed to create category: No data returned');
      }

      console.log(`Successfully created category '${categoryName}' with ID: ${newCategory.id}`);
      return newCategory;
    } catch (error) {
      console.error('Error getting or creating category:', error);
      throw error;
    }
  }

  // Company operations
  async getCompanies(): Promise<Company[]> {
    try {
      const { data, error } = await this.authService.supabase
        .from('companies')
        .select(
          `
          *,
          exchange:exchanges(code, name),
          category:categories(name)
        `
        )
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return [];
    }
  }

  async getCompanyBySymbol(tickerSymbol: string): Promise<Company | null> {
    try {
      const { data, error } = await this.authService.supabase
        .from('companies')
        .select(
          `
          *,
          exchange:exchanges(code, name),
          category:categories(name)
        `
        )
        .eq('ticker_symbol', tickerSymbol)
        .maybeSingle(); // Use maybeSingle to handle no results

      if (error) {
        // Don't throw error for PGRST116 (no results), return null
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching company:', error);
      return null;
    }
  }

  async createOrUpdateCompany(companyData: Partial<Company>): Promise<Company | null> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await this.authService.supabase.auth.getSession();
      if (sessionError || !session?.user?.id) throw new Error('User not authenticated');

      const companyRecord = {
        ...companyData,
        updated_by: session.user.id,
      };

      // Check if company exists
      if (companyData.ticker_symbol) {
        const existingCompany = await this.getCompanyBySymbol(companyData.ticker_symbol);

        if (existingCompany) {
          // Update existing company
          const { data, error } = await this.authService.supabase
            .from('companies')
            .update(companyRecord)
            .eq('ticker_symbol', companyData.ticker_symbol)
            .select()
            .single();

          if (error) throw error;
          return data;
        }
      }

      // Create new company
      const { data, error } = await this.authService.supabase
        .from('companies')
        .insert([companyRecord])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating/updating company:', error);
      return null;
    }
  }

  // Market data operations
  async getMarketDataByDate(date: string): Promise<MarketDataResponse> {
    try {
      const { data, error } = await this.authService.supabase
        .from('market_data')
        .select(
          `
          *,
          company:companies(
            *,
            exchange:exchanges(code, name),
            category:categories(name)
          )
        `
        )
        .eq('record_date', date)
        .order('percentage_change', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const companies: CompanyWithMarketData[] = (data || []).map((item) => ({
        ...item.company,
        market_data: {
          id: item.id,
          company_id: item.company_id,
          record_date: item.record_date,
          current_price: item.current_price,
          previous_close: item.previous_close,
          percentage_change: item.percentage_change,
          updated_by: item.updated_by,
          updated_at: item.updated_at,
        },
      }));

      return {
        date,
        companies,
      };
    } catch (error) {
      console.error('Error fetching market data:', error);
      return { date, companies: [] };
    }
  }

  async saveMarketData(
    parsedData: ParsedStockData[],
    recordDate: string,
    exchangeCode: string = 'NSE',
    progressCallback?: (progress: number, message: string) => void
  ): Promise<boolean> {
    try {
      const totalSteps = parsedData.length + 2; // +2 for exchange and category setup
      let currentStep = 0;

      const updateProgress = (message: string) => {
        currentStep++;
        const progress = Math.min(Math.round((currentStep / totalSteps) * 100), 100);
        if (progressCallback) {
          progressCallback(progress, message);
        }
      };

      const {
        data: { session },
        error: sessionError,
      } = await this.authService.supabase.auth.getSession();
      if (sessionError || !session?.user?.id) throw new Error('User not authenticated');

      // Get or create exchange based on the selected exchange
      updateProgress('Setting up exchange...');
      let exchange = await this.getExchangeByCode(exchangeCode);
      if (!exchange) {
        exchange = await this.createExchange({ code: exchangeCode });
        if (!exchange) throw new Error(`Failed to create ${exchangeCode} exchange`);
      }

      // Get or create default category
      updateProgress('Setting up category...');
      const defaultCategory = await this.getOrCreateDefaultCategory('Good');
      if (!defaultCategory) throw new Error('Failed to get or create default category');

      // Process each stock
      for (let i = 0; i < parsedData.length; i++) {
        const stock = parsedData[i];
        updateProgress(`Processing ${stock.tickerSymbol} (${i + 1}/${parsedData.length})...`);

        // Create or update company
        const company = await this.createOrUpdateCompany({
          ticker_symbol: stock.tickerSymbol,
          name: stock.companyName,
          exchange_id: exchange.id,
          category_id: defaultCategory.id,
        });

        if (company) {
          // Save market data
          const marketDataRecord = {
            company_id: company.id,
            record_date: recordDate,
            current_price: stock.currentPrice,
            previous_close: stock.lastDayPrice,
            percentage_change: stock.changePercent,
            updated_by: session.user.id,
          };

          const { error } = await this.authService.supabase
            .from('market_data')
            .upsert([marketDataRecord], {
              onConflict: 'company_id,record_date',
            });

          if (error) throw error;
        }
      }
      return true;
    } catch (error) {
      console.error('Error saving market data:', error);
      return false;
    }
  }

  async createExchange(exchange: Partial<Exchange>): Promise<Exchange | null> {
    try {
      const { data, error } = await this.authService.supabase
        .from('exchanges')
        .insert([exchange])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating exchange:', error);
      return null;
    }
  }

  async getHistoricalData(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<MarketData[]> {
    try {
      const { data, error } = await this.authService.supabase
        .from('market_data')
        .select('*')
        .eq('company_id', companyId)
        .gte('record_date', startDate)
        .lte('record_date', endDate)
        .order('record_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }

  // Get available dates with market data
  async getAvailableDates(): Promise<string[]> {
    try {
      const { data, error } = await this.authService.supabase
        .from('market_data')
        .select('record_date')
        .order('record_date', { ascending: false });

      if (error) throw error;

      // Extract unique dates
      const uniqueDates = [...new Set((data || []).map((item) => item.record_date))];
      return uniqueDates;
    } catch (error) {
      console.error('Error fetching available dates:', error);
      return [];
    }
  }

  // Comment operations
  async updateCompanyComment(companyId: string, comment: string): Promise<void> {
    try {
      const { error } = await this.authService.supabase
        .from('companies')
        .update({ comments: comment })
        .eq('id', companyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  // Category operations
  async updateCompanyCategory(companyId: string, categoryId: number | null): Promise<void> {
    try {
      const { error } = await this.authService.supabase
        .from('companies')
        .update({ category_id: categoryId })
        .eq('id', companyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Get company occurrence count across all dates
  async getCompanyOccurrenceCount(tickerSymbol: string): Promise<number> {
    try {
      const { data, error } = await this.authService.supabase
        .from('market_data')
        .select('id', { count: 'exact', head: false })
        .eq('company_id', await this.getCompanyIdByTicker(tickerSymbol));

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error getting occurrence count:', error);
      return 0;
    }
  }

  private async getCompanyIdByTicker(tickerSymbol: string): Promise<string | null> {
    try {
      const { data, error } = await this.authService.supabase
        .from('companies')
        .select('id')
        .eq('ticker_symbol', tickerSymbol)
        .maybeSingle();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('Error getting company ID:', error);
      return null;
    }
  }

  // Get historical market data for a company
  async getCompanyHistoricalData(companyId: string): Promise<MarketData[]> {
    try {
      const { data, error } = await this.authService.supabase
        .from('market_data')
        .select('*')
        .eq('company_id', companyId)
        .order('record_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching historical data:', error);
      return [];
    }
  }
}
