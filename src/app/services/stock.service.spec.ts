import { TestBed } from '@angular/core/testing';
import { StockService } from './stock.service';
import { DatabaseService } from './database.service';

describe('StockService', () => {
  let service: StockService;
  let mockDatabaseService: jasmine.SpyObj<DatabaseService>;

  beforeEach(() => {
    mockDatabaseService = jasmine.createSpyObj('DatabaseService', ['saveMarketData']);

    TestBed.configureTestingModule({
      providers: [StockService, { provide: DatabaseService, useValue: mockDatabaseService }],
    });

    service = TestBed.inject(StockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseTableData', () => {
    const dateInput = '2024-12-02';

    it('should return empty stocks array for empty input', () => {
      const result = service.parseTableData('', dateInput);
      expect(result.stocks).toEqual([]);
      expect(result.date).toBe(dateInput);
    });

    it('should parse standard ticker symbols starting with letters (e.g., RELIANCE)', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
RELIANCE Reliance Industries Limited\t5.25%\t2,500.50\t2,375.00`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks.length).toBe(1);
      expect(result.stocks[0].symbol).toBe('RELIANCE');
      expect(result.stocks[0].company).toBe('Reliance Industries Limited');
      expect(result.stocks[0].changePercent).toBe(5.25);
      expect(result.stocks[0].currentPrice).toBe(2500.5);
      expect(result.stocks[0].lastDayPrice).toBe(2375.0);
    });

    it('should parse ticker symbols starting with digits (e.g., 3MINDIA)', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
3MINDIA 3M India Limited\t3.50%\t1,250.00\t1,207.73`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks.length).toBe(1);
      expect(result.stocks[0].symbol).toBe('3MINDIA');
      expect(result.stocks[0].company).toBe('3M India Limited');
      expect(result.stocks[0].changePercent).toBe(3.5);
    });

    it('should parse ticker symbols with multiple leading digits (e.g., 21STCENMGM)', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
21STCENMGM 21st Century Management Services\t2.00%\t100.00\t98.04`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks.length).toBe(1);
      expect(result.stocks[0].symbol).toBe('21STCENMGM');
      expect(result.stocks[0].company).toBe('21st Century Management Services');
    });

    it('should parse ticker symbols with digits in the middle (e.g., SILVER360)', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
SILVER360 Silver 360 Ltd\t4.75%\t850.00\t811.45`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks.length).toBe(1);
      expect(result.stocks[0].symbol).toBe('SILVER360');
      expect(result.stocks[0].company).toBe('Silver 360 Ltd');
      expect(result.stocks[0].changePercent).toBe(4.75);
    });

    it('should handle lowercase ticker symbols by converting to uppercase', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
reliance Reliance Industries\t4.00%\t2,500.00\t2,403.85`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks.length).toBe(1);
      expect(result.stocks[0].symbol).toBe('RELIANCE');
    });

    it('should handle mixed case ticker symbols (e.g., 3mindia)', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
3mindia 3M India Limited\t3.50%\t1,250.00\t1,207.73`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks.length).toBe(1);
      expect(result.stocks[0].symbol).toBe('3MINDIA');
    });

    it('should parse multiple stocks and sort by changePercent descending', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
RELIANCE Reliance Industries\t5.00%\t2,500.00\t2,380.95
3MINDIA 3M India Limited\t10.00%\t1,250.00\t1,136.36
INFY Infosys Limited\t3.00%\t1,500.00\t1,456.31`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks.length).toBe(3);
      // Should be sorted by changePercent descending
      expect(result.stocks[0].symbol).toBe('3MINDIA');
      expect(result.stocks[0].changePercent).toBe(10.0);
      expect(result.stocks[1].symbol).toBe('RELIANCE');
      expect(result.stocks[1].changePercent).toBe(5.0);
      expect(result.stocks[2].symbol).toBe('INFY');
      expect(result.stocks[2].changePercent).toBe(3.0);
    });

    it('should handle change percent without % symbol', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
RELIANCE Reliance Industries\t5.25\t2,500.00\t2,375.00`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks[0].changePercent).toBe(5.25);
    });

    it('should handle prices with comma separators', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
RELIANCE Reliance Industries\t5%\t25,000.50\t23,750.00`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks[0].currentPrice).toBe(25000.5);
      expect(result.stocks[0].lastDayPrice).toBe(23750.0);
    });

    it('should skip rows with fewer than 4 columns', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
RELIANCE Reliance Industries\t5%\t2,500.00
INFY Infosys\t3%\t1,500.00\t1,456.31`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks.length).toBe(1);
      expect(result.stocks[0].symbol).toBe('INFY');
    });

    it('should use full column as company name if pattern does not match', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
Just A Company Name Without Symbol\t5%\t100.00\t95.24`;

      const result = service.parseTableData(tableInput, dateInput);

      expect(result.stocks.length).toBe(1);
      expect(result.stocks[0].symbol).toBe('');
      expect(result.stocks[0].company).toBe('Just A Company Name Without Symbol');
    });
  });

  describe('parseTableDataForDatabase', () => {
    it('should return empty array for empty input', () => {
      const result = service.parseTableDataForDatabase('');
      expect(result).toEqual([]);
    });

    it('should parse standard ticker symbols starting with letters', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
RELIANCE Reliance Industries Limited\t5.25%\t2,500.50\t2,375.00`;

      const result = service.parseTableDataForDatabase(tableInput);

      expect(result.length).toBe(1);
      expect(result[0].tickerSymbol).toBe('RELIANCE');
      expect(result[0].companyName).toBe('Reliance Industries Limited');
      expect(result[0].changePercent).toBe(5.25);
      expect(result[0].currentPrice).toBe(2500.5);
      expect(result[0].lastDayPrice).toBe(2375.0);
    });

    it('should parse ticker symbols starting with digits (e.g., 3MINDIA)', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
3MINDIA 3M India Limited\t3.50%\t1,250.00\t1,207.73`;

      const result = service.parseTableDataForDatabase(tableInput);

      expect(result.length).toBe(1);
      expect(result[0].tickerSymbol).toBe('3MINDIA');
      expect(result[0].companyName).toBe('3M India Limited');
    });

    it('should parse ticker symbols with multiple leading digits', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
21STCENMGM 21st Century Management\t2.00%\t100.00\t98.04`;

      const result = service.parseTableDataForDatabase(tableInput);

      expect(result.length).toBe(1);
      expect(result[0].tickerSymbol).toBe('21STCENMGM');
    });

    it('should convert lowercase ticker symbols to uppercase', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
3mindia 3M India Limited\t3.50%\t1,250.00\t1,207.73`;

      const result = service.parseTableDataForDatabase(tableInput);

      expect(result.length).toBe(1);
      expect(result[0].tickerSymbol).toBe('3MINDIA');
    });

    it('should handle all lowercase input', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
reliance reliance industries\t5%\t2,500.00\t2,380.95`;

      const result = service.parseTableDataForDatabase(tableInput);

      expect(result.length).toBe(1);
      expect(result[0].tickerSymbol).toBe('RELIANCE');
      expect(result[0].companyName).toBe('reliance industries');
    });

    it('should sort results by changePercent descending', () => {
      const tableInput = `Company\tChange\tCurrent\tLast
RELIANCE Reliance\t5%\t2,500.00\t2,380.95
3MINDIA 3M India\t10%\t1,250.00\t1,136.36
INFY Infosys\t3%\t1,500.00\t1,456.31`;

      const result = service.parseTableDataForDatabase(tableInput);

      expect(result.length).toBe(3);
      expect(result[0].tickerSymbol).toBe('3MINDIA');
      expect(result[1].tickerSymbol).toBe('RELIANCE');
      expect(result[2].tickerSymbol).toBe('INFY');
    });
  });

  describe('saveToDatabase', () => {
    it('should return false for empty input', async () => {
      const result = await service.saveToDatabase('', '2024-12-02', 'NSE');
      expect(result).toBeFalse();
      expect(mockDatabaseService.saveMarketData).not.toHaveBeenCalled();
    });

    it('should call databaseService.saveMarketData with parsed data', async () => {
      const tableInput = `Company\tChange\tCurrent\tLast
3MINDIA 3M India\t5%\t1,250.00\t1,190.48`;
      const date = '2024-12-02';
      const exchange = 'NSE';

      mockDatabaseService.saveMarketData.and.returnValue(Promise.resolve(true));

      const result = await service.saveToDatabase(tableInput, date, exchange);

      expect(result).toBeTrue();
      expect(mockDatabaseService.saveMarketData).toHaveBeenCalledWith(
        jasmine.arrayContaining([
          jasmine.objectContaining({
            tickerSymbol: '3MINDIA',
            companyName: '3M India',
          }),
        ]),
        date,
        exchange,
        undefined
      );
    });

    it('should pass progress callback to databaseService', async () => {
      const tableInput = `Company\tChange\tCurrent\tLast
RELIANCE Reliance\t5%\t2,500.00\t2,380.95`;
      const progressCallback = jasmine.createSpy('progressCallback');

      mockDatabaseService.saveMarketData.and.returnValue(Promise.resolve(true));

      await service.saveToDatabase(tableInput, '2024-12-02', 'NSE', progressCallback);

      expect(mockDatabaseService.saveMarketData).toHaveBeenCalledWith(
        jasmine.any(Array),
        '2024-12-02',
        'NSE',
        progressCallback
      );
    });
  });
});
