import {
  Component,
  inject,
  signal,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '../dialog/dialog.service';
import { DatabaseService } from '../../services/database.service';
import { BreakpointService } from '../../services/breakpoint.service';
import { CategoryStore } from '../../store/category.store';
import { StockStore } from '../../store/stock.store';
import { CompanyWithMarketData, MarketData } from '../../interfaces/stock-data.interface';
import type { Chart, ChartConfiguration, TooltipItem } from 'chart.js';

@Component({
  selector: 'app-edit-company-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="max-h-[85vh] overflow-y-auto"
      (touchstart)="onTouchStart($event)"
      (touchend)="onTouchEnd($event)"
    >
      <div class="mb-6">
        <div class="flex items-center gap-4">
          <div
            class="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900"
          >
            <svg
              class="h-6 w-6 text-blue-600 dark:text-blue-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <div class="flex items-baseline gap-3 flex-wrap">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white" id="modal-title">
              Edit Company Details
            </h3>
            @if (companiesList.length > 0) {
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ currentIndex + 1 }} / {{ companiesList.length }}
            </span>
            }
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Company Info (Read-only) -->
        <div
          class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 space-y-2 border border-blue-100 dark:border-gray-600"
        >
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Ticker:</span>
            <span class="text-sm font-bold text-blue-600 dark:text-blue-400">{{
              tickerSymbol
            }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Company:</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{
              companyName
            }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Current Price:</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">{{
              currentPrice
            }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Change:</span>
            <span class="text-sm font-semibold" [class]="changeClass">{{ percentageChange }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">Occurrences:</span>
            <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">{{
              occurrenceCount
            }}</span>
          </div>
        </div>

        <!-- Historical Price Chart -->
        @if (isLoadingChart()) {
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center justify-center h-64">
            <svg
              class="animate-spin h-8 w-8 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
        } @else if (historicalData().length > 0) {
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Price History ({{ historicalData().length }} records)
          </h4>
          <div
            class="relative"
            [class.h-[200px]]="breakpoint.isMobile()"
            [class.h-64]="!breakpoint.isMobile()"
          >
            <canvas #priceChart></canvas>
          </div>

          <!-- Historical Data Table -->
          <div class="mt-4 max-h-48 overflow-y-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  <th
                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    Date
                  </th>
                  <th
                    class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    Price
                  </th>
                  <th
                    class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    Prev Close
                  </th>
                  <th
                    class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    Change %
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                @for (data of historicalData(); track data.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td class="px-3 py-2 text-xs text-gray-900 dark:text-gray-200">
                    {{ formatDate(data.record_date) }}
                  </td>
                  <td
                    class="px-3 py-2 text-xs text-right font-medium text-gray-900 dark:text-gray-200"
                  >
                    {{ formatPrice(data.current_price) }}
                  </td>
                  <td class="px-3 py-2 text-xs text-right text-gray-600 dark:text-gray-400">
                    {{ formatPrice(data.previous_close) }}
                  </td>
                  <td
                    class="px-3 py-2 text-xs text-right font-semibold"
                    [class.text-green-600]="(data.percentage_change ?? 0) >= 0"
                    [class.text-red-600]="(data.percentage_change ?? 0) < 0"
                    [class.dark:text-green-400]="(data.percentage_change ?? 0) >= 0"
                    [class.dark:text-red-400]="(data.percentage_change ?? 0) < 0"
                    [class.text-gray-500]="
                      data.percentage_change === undefined || data.percentage_change === null
                    "
                  >
                    {{ formatChange(data.percentage_change) }}
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        } @else {
        <div
          class="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 text-center"
        >
          <svg
            class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">No historical data available</p>
        </div>
        }

        <!-- Category Field -->
        <div>
          <label
            for="category"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Category
          </label>
          <div class="flex gap-2">
            <select
              id="category"
              [(ngModel)]="selectedCategoryId"
              class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm text-base border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white px-3 py-3 h-12 sm:h-auto sm:py-2"
            >
              <option [value]="null">-- Select Category --</option>
              @for (category of categoryStore.categories(); track category.id) {
              <option [value]="category.id">{{ category.name }}</option>
              }
            </select>
            <button
              type="button"
              (click)="openAddCategoryInline()"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Add new category"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
          @if (isAddingInlineCategory()) {
          <div class="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
            <div class="flex gap-2">
              <input
                type="text"
                [(ngModel)]="newInlineCategoryName"
                (keyup.enter)="addInlineCategory()"
                (keyup.escape)="cancelInlineCategory()"
                placeholder="New category name"
                class="flex-1 shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white px-3 py-2"
              />
              <button
                type="button"
                (click)="addInlineCategory()"
                class="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add
              </button>
              <button
                type="button"
                (click)="cancelInlineCategory()"
                class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
          }
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select a category or add a new one
          </p>
        </div>

        <!-- Comments Field -->
        <div>
          <label
            for="comments"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Comments
          </label>
          <textarea
            id="comments"
            [(ngModel)]="commentText"
            rows="4"
            placeholder="Add notes or observations about this company..."
            class="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm text-base border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white px-3 py-3 sm:py-2"
          ></textarea>
        </div>

        <!-- Success/Error Message -->
        @if (saveMessage()) {
        <div
          [class]="saveSuccess() ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'"
          class="p-4 rounded-lg border"
        >
          <div class="flex items-center">
            @if (saveSuccess()) {
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            } @else {
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            }
            <p class="text-sm font-medium">{{ saveMessage() }}</p>
          </div>
        </div>
        }
      </div>
    </div>

    <div
      class="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700 sm:flex sm:items-center sm:justify-between gap-3"
    >
      <!-- Navigation Buttons (Left side) -->
      <div class="flex gap-2 mb-3 sm:mb-0">
        @if (currentIndex > 0) {
        <button
          type="button"
          (click)="navigatePrevious()"
          [disabled]="isSaving()"
          class="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-3 sm:py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-0"
          title="Previous company"
        >
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
          Previous
        </button>
        } @if (currentIndex < companiesList.length - 1) {
        <button
          type="button"
          (click)="navigateNext()"
          [disabled]="isSaving()"
          class="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-3 sm:py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-0"
          title="Next company"
        >
          Next
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </button>
        }
      </div>

      <!-- Action Buttons (Right side) -->
      <div class="flex flex-col-reverse sm:flex-row gap-3">
        <button
          type="button"
          (click)="cancel()"
          [disabled]="isSaving()"
          class="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-3 sm:py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-0"
        >
          Cancel
        </button>
        <button
          type="button"
          (click)="save()"
          [disabled]="isSaving()"
          class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-3 sm:py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-0"
        >
          @if (isSaving()) {
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Saving... } @else { Save Changes }
        </button>
      </div>
    </div>
  `,
})
export class EditCompanyModalComponent implements OnInit, AfterViewInit {
  @ViewChild('priceChart') priceChartRef!: ElementRef<HTMLCanvasElement>;

  // Inputs
  companyId!: string;
  companyName!: string;
  tickerSymbol!: string;
  currentPrice!: string;
  percentageChange!: string;
  changeClass!: string;
  occurrenceCount!: number;
  category: string = '';
  comment: string = '';
  onSave!: () => void;
  onClose?: () => void;

  // Navigation properties
  companiesList: CompanyWithMarketData[] = [];
  currentIndex: number = 0;
  occurrenceCounts: Map<string, number> = new Map();

  categoryValue: string = '';
  selectedCategoryId: number | null = null;
  commentText: string = '';
  isSaving = signal(false);
  isLoadingChart = signal(true);
  historicalData = signal<MarketData[]>([]);
  isAddingInlineCategory = signal(false);
  newInlineCategoryName = signal('');
  saveMessage = signal<string | null>(null);
  saveSuccess = signal(false);

  private chart?: Chart;
  private touchStartX = 0;
  private touchStartY = 0;
  private dialogService = inject(DialogService);
  private databaseService = inject(DatabaseService);
  readonly breakpoint = inject(BreakpointService);
  readonly categoryStore = inject(CategoryStore);
  readonly stockStore = inject(StockStore);

  async ngOnInit() {
    this.categoryValue = this.category || '';
    this.commentText = this.comment || '';
    await this.loadCategories();
    this.loadHistoricalData();
  }

  ngAfterViewInit() {
    // Chart will be created after data loads
  }

  async loadHistoricalData() {
    this.isLoadingChart.set(true);
    try {
      const data = await this.databaseService.getCompanyHistoricalData(this.companyId);
      this.historicalData.set(data);
      this.isLoadingChart.set(false);

      // Wait for the DOM to update and ViewChild to be available
      setTimeout(() => {
        if (data.length > 0) {
          this.createChart();
        }
      }, 200);
    } catch (error) {
      console.error('Error loading historical data:', error);
      this.isLoadingChart.set(false);
    }
  }

  async createChart() {
    if (!this.priceChartRef?.nativeElement) {
      console.warn('Canvas element not found');
      return;
    }

    // Dynamically import Chart.js only when needed
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);

    const data = this.historicalData();
    const labels = data.map((d) => this.formatDate(d.record_date));
    const prices = data.map((d) => d.current_price || 0);

    const isDark = document.documentElement.classList.contains('dark');
    const isMobile = this.breakpoint.isMobile();

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Price',
            data: prices,
            borderColor: isDark ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
            backgroundColor: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y',
            borderWidth: isMobile ? 2 : 3,
            pointRadius: isMobile ? 2 : 4,
            pointHoverRadius: isMobile ? 4 : 6,
            pointBackgroundColor: isDark ? 'rgb(96, 165, 250)' : 'rgb(37, 99, 235)',
            pointBorderColor: isDark ? '#1e293b' : '#ffffff',
            pointBorderWidth: isMobile ? 1 : 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: !isMobile,
            position: 'top',
            labels: {
              color: isDark ? '#f3f4f6' : '#1f2937',
              font: {
                size: 12,
                weight: 500,
              },
              usePointStyle: true,
              padding: 15,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#f3f4f6' : '#1f2937',
            bodyColor: isDark ? '#d1d5db' : '#4b5563',
            borderColor: isDark ? '#4b5563' : '#d1d5db',
            borderWidth: 1,
            padding: isMobile ? 8 : 12,
            displayColors: !isMobile,
            titleFont: {
              size: isMobile ? 11 : 13,
            },
            bodyFont: {
              size: isMobile ? 11 : 13,
            },
            callbacks: {
              label: (context: TooltipItem<'line'>) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                const value = context.parsed.y;
                if (value !== null) {
                  if (context.datasetIndex === 0) {
                    label += '₹' + value.toFixed(2);
                  } else {
                    label += value.toFixed(2) + '%';
                  }
                }
                return label;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: !isMobile,
              color: isDark ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.5)',
            },
            ticks: {
              color: isDark ? '#d1d5db' : '#4b5563',
              font: {
                size: isMobile ? 9 : 11,
                weight: 500,
              },
              maxRotation: isMobile ? 90 : 45,
              minRotation: isMobile ? 45 : 45,
              maxTicksLimit: isMobile ? 6 : undefined,
            },
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: !isMobile,
              text: 'Price (₹)',
              color: isDark ? '#f3f4f6' : '#1f2937',
              font: {
                size: 12,
                weight: 600,
              },
            },
            ticks: {
              color: isDark ? '#d1d5db' : '#4b5563',
              font: {
                size: isMobile ? 9 : 11,
                weight: 500,
              },
              maxTicksLimit: isMobile ? 6 : undefined,
            },
            grid: {
              color: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(209, 213, 219, 0.5)',
            },
          },
        },
      },
    };

    this.chart = new Chart(this.priceChartRef.nativeElement, config);
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === null) return 'N/A';
    return '₹' + price.toFixed(2);
  }

  formatChange(change?: number): string {
    if (change === undefined || change === null) return 'N/A';
    return (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
  }

  async loadCategories() {
    try {
      const categories = await this.databaseService.getCategories();
      this.categoryStore.setCategories(categories);
      
      // Set selected category ID based on current company's category
      const currentCompany = this.companiesList[this.currentIndex];
      if (currentCompany?.category_id) {
        this.selectedCategoryId = currentCompany.category_id;
      } else {
        this.selectedCategoryId = null;
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  openAddCategoryInline() {
    this.isAddingInlineCategory.set(true);
    this.newInlineCategoryName.set('');
  }

  cancelInlineCategory() {
    this.isAddingInlineCategory.set(false);
    this.newInlineCategoryName.set('');
  }

  async addInlineCategory() {
    const name = this.newInlineCategoryName().trim();
    if (!name) return;

    try {
      const category = await this.databaseService.getOrCreateDefaultCategory(name);
      this.categoryStore.addCategory(category);
      this.selectedCategoryId = category.id;
      this.isAddingInlineCategory.set(false);
      this.newInlineCategoryName.set('');
    } catch (error) {
      console.error('Error adding category:', error);
      alert('Failed to add category');
    }
  }

  getChangeClass(change?: number): string {
    if (change === undefined || change === null) return 'text-gray-500';
    return change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  }

  async save() {
    if (this.isSaving()) return;

    // Confirm if clearing both fields
    if (!this.commentText.trim() && !this.selectedCategoryId && (this.comment || this.category)) {
      if (!confirm('Are you sure you want to clear both category and comments?')) {
        return;
      }
    }

    this.isSaving.set(true);
    this.saveMessage.set(null);

    try {
      // Update category
      await this.databaseService.updateCompanyCategory(this.companyId, this.selectedCategoryId);

      // Update comments
      await this.databaseService.updateCompanyComment(this.companyId, this.commentText.trim());

      // Update local store instead of full refresh
      const categoryName = this.selectedCategoryId 
        ? this.categoryStore.categories().find(c => c.id === this.selectedCategoryId)?.name || ''
        : '';
      
      this.stockStore.updateCompanyInMarketData(this.companyId, {
        comments: this.commentText.trim(),
        category_id: this.selectedCategoryId || undefined,
        category: this.selectedCategoryId ? { id: this.selectedCategoryId, name: categoryName } : undefined,
      });

      if (this.onSave) this.onSave();
      
      // Show success message instead of closing
      this.saveSuccess.set(true);
      this.saveMessage.set('Changes saved successfully!');
      
      // Auto-clear message after 3 seconds
      setTimeout(() => {
        this.saveMessage.set(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving company details:', error);
      this.saveSuccess.set(false);
      this.saveMessage.set('Failed to save changes. Please try again.');
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    if (this.onClose) this.onClose();
    this.dialogService.close();
  }

  navigateNext(): void {
    if (this.currentIndex < this.companiesList.length - 1) {
      this.currentIndex++;
      this.loadCompanyData(this.companiesList[this.currentIndex]);
    }
  }

  navigatePrevious(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.loadCompanyData(this.companiesList[this.currentIndex]);
    }
  }

  private loadCompanyData(company: CompanyWithMarketData): void {
    this.companyId = company.id;
    this.companyName = company.name;
    this.tickerSymbol = company.ticker_symbol;
    this.currentPrice = this.formatPrice(company.market_data?.current_price);
    this.percentageChange = this.formatChange(company.market_data?.percentage_change);
    this.changeClass = this.getChangeClass(company.market_data?.percentage_change);
    this.occurrenceCount = this.occurrenceCounts.get(company.ticker_symbol) || 0;
    this.categoryValue = company.category?.name || '';
    this.selectedCategoryId = company.category_id || null;
    this.commentText = company.comments || '';
    this.category = company.category?.name || '';
    this.comment = company.comments || '';

    // Reload historical data for new company
    this.loadHistoricalData();
  }

  // Touch event handlers for mobile swipe navigation
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
  }

  onTouchEnd(event: TouchEvent): void {
    if (!event.changedTouches.length) return;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;

    const deltaX = touchEndX - this.touchStartX;
    const deltaY = touchEndY - this.touchStartY;

    // Check if horizontal swipe is dominant (more horizontal than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && this.currentIndex > 0) {
        // Swipe right - go to previous
        this.navigatePrevious();
      } else if (deltaX < 0 && this.currentIndex < this.companiesList.length - 1) {
        // Swipe left - go to next
        this.navigateNext();
      }
    }
  }
}
