/**
 * Shared barrel export for commonly used components and utilities
 *
 * Usage:
 * import { ShimmerLoaderComponent, ToastMessageComponent, IconsComponent } from '@app/shared';
 * import { formatPrice, formatChange, getChangeClass } from '@app/shared';
 */

// Components
export { ShimmerLoaderComponent } from '../components/shimmer-loader/shimmer-loader.component';
export { ToastMessageComponent } from '../components/toast-message/toast-message.component';
export type { ToastMessage } from '../components/toast-message/toast-message.component';
export { IconsComponent } from '../components/svg/icons';

// Utilities
export {
  formatPrice,
  formatPriceSimple,
  formatChange,
  formatChangeWithSign,
  getChangeClass,
} from '../utils/format.utils';
