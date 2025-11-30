/**
 * Shared formatting utilities for the StocksPulse application.
 * These functions handle common formatting tasks like currency and percentage display.
 */

/**
 * Format a number as Indian Rupee currency.
 * @param price - The price value to format
 * @returns Formatted currency string or 'N/A' if undefined/null
 */
export function formatPrice(price?: number): string {
  if (price === undefined || price === null) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Format a number as simple rupee value (₹ prefix without locale formatting).
 * Used for compact display in modals/cards.
 * @param price - The price value to format
 * @returns Formatted price string or 'N/A' if undefined/null
 */
export function formatPriceSimple(price?: number): string {
  if (price === undefined || price === null) return 'N/A';
  return '₹' + price.toFixed(2);
}

/**
 * Format a percentage change value.
 * @param change - The percentage change value
 * @returns Formatted percentage string or 'N/A' if undefined/null
 */
export function formatChange(change?: number): string {
  if (change === undefined || change === null) return 'N/A';
  return `${change.toFixed(2)}%`;
}

/**
 * Format a percentage change value with +/- prefix.
 * Used for display where sign indication is important.
 * @param change - The percentage change value
 * @returns Formatted percentage string with sign prefix
 */
export function formatChangeWithSign(change?: number): string {
  if (change === undefined || change === null) return 'N/A';
  return (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
}

/**
 * Get CSS class for positive/negative change values.
 * @param change - The change value to evaluate
 * @returns CSS class string for styling
 */
export function getChangeClass(change?: number): string {
  if (change === undefined || change === null) return 'text-gray-500';
  return change >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold';
}

/**
 * Get CSS class for positive/negative change values (with dark mode support).
 * @param change - The change value to evaluate
 * @returns CSS class string for styling with dark mode
 */
export function getChangeClassWithDark(change?: number): string {
  if (change === undefined || change === null) return 'text-gray-500';
  return change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}

/**
 * Format a date string for display.
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "29 Nov")
 */
export function formatDateShort(dateString?: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
