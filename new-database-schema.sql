-- Create exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker_symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    comments TEXT,
    exchange_id BIGINT REFERENCES exchanges(id) ON DELETE
    SET NULL,
        category_id BIGINT REFERENCES categories(id) ON DELETE
    SET NULL,
        updated_by UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create market_data table
CREATE TABLE IF NOT EXISTS market_data (
    id BIGSERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    current_price NUMERIC(10, 2) NOT NULL,
    percentage_change NUMERIC(5, 2) NOT NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(company_id, record_date)
);
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_ticker_symbol ON companies(ticker_symbol);
CREATE INDEX IF NOT EXISTS idx_companies_exchange_id ON companies(exchange_id);
CREATE INDEX IF NOT EXISTS idx_companies_category_id ON companies(category_id);
CREATE INDEX IF NOT EXISTS idx_market_data_company_id ON market_data(company_id);
CREATE INDEX IF NOT EXISTS idx_market_data_record_date ON market_data(record_date);
CREATE INDEX IF NOT EXISTS idx_market_data_date_company ON market_data(record_date, company_id);
CREATE INDEX IF NOT EXISTS idx_market_data_change_desc ON market_data(percentage_change DESC);
-- Enable Row Level Security
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
-- Create RLS policies for exchanges
-- Users can view all exchanges
CREATE POLICY "Users can view exchanges" ON exchanges FOR
SELECT USING (true);
-- Authenticated users can insert exchanges
CREATE POLICY "Authenticated users can insert exchanges" ON exchanges FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- Users can update exchanges
CREATE POLICY "Users can update exchanges" ON exchanges FOR
UPDATE USING (true);
-- Users can delete exchanges
CREATE POLICY "Users can delete exchanges" ON exchanges FOR DELETE USING (true);
-- Create RLS policies for categories
-- Users can view all categories
CREATE POLICY "Users can view categories" ON categories FOR
SELECT USING (true);
-- Authenticated users can insert categories
CREATE POLICY "Authenticated users can insert categories" ON categories FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- Users can update categories
CREATE POLICY "Users can update categories" ON categories FOR
UPDATE USING (true);
-- Users can delete categories
CREATE POLICY "Users can delete categories" ON categories FOR DELETE USING (true);
-- Create RLS policies for companies
-- Users can view all companies
CREATE POLICY "Users can view companies" ON companies FOR
SELECT USING (true);
-- Authenticated users can insert companies
CREATE POLICY "Authenticated users can insert companies" ON companies FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- Users can update their own companies
CREATE POLICY "Users can update own companies" ON companies FOR
UPDATE USING (auth.uid() = updated_by);
-- Users can delete their own companies
CREATE POLICY "Users can delete own companies" ON companies FOR DELETE USING (auth.uid() = updated_by);
-- Create RLS policies for market_data
-- Users can view all market data
CREATE POLICY "Users can view market data" ON market_data FOR
SELECT USING (true);
-- Authenticated users can insert market data
CREATE POLICY "Authenticated users can insert market data" ON market_data FOR
INSERT WITH CHECK (auth.role() = 'authenticated');
-- Users can update their own market data
CREATE POLICY "Users can update own market data" ON market_data FOR
UPDATE USING (auth.uid() = updated_by);
-- Users can delete their own market data
CREATE POLICY "Users can delete own market data" ON market_data FOR DELETE USING (auth.uid() = updated_by);
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Create triggers to automatically update updated_at
CREATE TRIGGER update_exchanges_updated_at BEFORE
UPDATE ON exchanges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE
UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE
UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_market_data_updated_at BEFORE
UPDATE ON market_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Insert default data
INSERT INTO exchanges (code)
VALUES ('NSE'),
    ('BSE'),
    ('NYSE'),
    ('NASDAQ') ON CONFLICT (code) DO NOTHING;
INSERT INTO categories (name)
VALUES ('Technology'),
    ('Finance'),
    ('Healthcare'),
    ('Energy'),
    ('Manufacturing'),
    ('Consumer Goods'),
    ('Real Estate'),
    ('Telecommunications'),
    ('Utilities'),
    ('Good'),
    ('Other') ON CONFLICT (name) DO NOTHING;
-- Create view for market data with company details
CREATE OR REPLACE VIEW market_data_with_companies AS
SELECT md.*,
    c.ticker_symbol,
    c.name as company_name,
    e.code as exchange_code,
    cat.name as category_name
FROM market_data md
    JOIN companies c ON md.company_id = c.id
    LEFT JOIN exchanges e ON c.exchange_id = e.id
    LEFT JOIN categories cat ON c.category_id = cat.id
ORDER BY md.record_date DESC,
    md.percentage_change DESC;